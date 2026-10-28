import { execFile, spawn, type ChildProcess } from "child_process";
import type { Request, Response } from "express";
import { YTDLP_BINARY, UNIVERSAL_EXTRACTOR_ARGS } from "../config/constants.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const STDERR_LIMIT = 16 * 1024;

export default (req: Request, res: Response) => {
  const videoId = ((req.query.id as string) || "").trim();
  const formatId = ((req.query.formatId as string) || "").trim();
  const fileExt = ((req.query.ext as string) || "mp4").trim().toLowerCase();
  const videoTitle = (req.query.title as string) || "downloaded_media";

  if (!videoId || !formatId) {
    return res
      .status(400)
      .send("Missing required parameter query properties: id and formatId.");
  }

  const safeTitle =
    videoTitle.replace(/[/\\?%*:|"<>]/g, "-").trim() || "downloaded_media";
  const isAudio =
    ["m4a", "mp3", "opus", "webm"].includes(fileExt) || formatId === "audio";
  const contentType =
    fileExt === "mp3" ? "audio/mpeg" : isAudio ? "audio/mp4" : "video/mp4";
  const baseArgs = [
    "--user-agent",
    USER_AGENT,
    "--no-check-certificates",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
  ];

  let cancelled = false;
  let responseDone = false;
  let activeFfmpeg: ChildProcess | null = null;
  let activeYtDlp: ChildProcess | null = null;
  let stderrData = "";

  const appendStderr = (chunk: Buffer) => {
    stderrData = (stderrData + chunk.toString()).slice(-STDERR_LIMIT);
  };

  const stopProcess = (child: ChildProcess | null) => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }
  };

  const stopProcesses = () => {
    stopProcess(activeYtDlp);
    stopProcess(activeFfmpeg);
  };

  const canRespond = () =>
    !cancelled && !responseDone && !res.destroyed && !res.writableEnded;

  const sendDownloadHeaders = () => {
    if (!canRespond() || res.headersSent) return;
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeTitle}.${fileExt}"`,
      "Cache-Control": "no-cache",
    });
  };

  const fail = (message: string, error?: Error) => {
    if (!canRespond()) return;

    console.error(
      "[Download Controller Error]",
      message,
      error?.message || stderrData,
    );
    responseDone = true;
    stopProcesses();

    if (!res.headersSent) {
      res.status(500).send(message);
    } else {
      res.end();
    }
  };

  const complete = () => {
    if (!canRespond()) return;
    responseDone = true;
    res.end();
  };

  const streamProcessOutput = (child: ChildProcess) => {
    const output = child.stdout;
    if (!output) {
      fail("Download process did not provide an output stream.");
      return;
    }

    output.once("data", sendDownloadHeaders);
    output.on("error", (error) => fail("Download output stream failed.", error));
    output.pipe(res);
  };

  res.on("close", () => {
    if (res.writableFinished) return;
    cancelled = true;
    stopProcesses();
  });

  res.on("finish", () => {
    responseDone = true;
    stopProcesses();
  });

  res.on("error", (error) => {
    console.error("[Download Controller] Response stream error:", error);
    cancelled = true;
    stopProcesses();
  });

  if (fileExt === "mp3") {
    console.log(
      "[Download Controller] Initializing transcoding pipe for MP3 conversion...",
    );

    activeYtDlp = spawn(YTDLP_BINARY, [
      ...baseArgs,
      "-f",
      "ba/bestaudio",
      "-o",
      "-",
      "--",
      videoId,
    ]);

    activeFfmpeg = spawn("ffmpeg", [
      "-i",
      "pipe:0",
      "-acodec",
      "libmp3lame",
      "-ab",
      "192k",
      "-f",
      "mp3",
      "pipe:1",
    ]);

    activeYtDlp.stderr?.on("data", appendStderr);
    activeYtDlp.on("error", (error) =>
      fail("Failed to start yt-dlp for audio download.", error),
    );
    activeYtDlp.on("close", (code) => {
      if (code !== 0 && !cancelled && !responseDone) {
        fail("Failed to extract audio for download.");
      }
    });

    activeFfmpeg.stderr?.on("data", appendStderr);
    activeFfmpeg.stdin?.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EPIPE") {
        fail("Failed to pass audio to the transcoder.", error);
      }
    });
    activeFfmpeg.on("error", (error) =>
      fail("Failed to start the audio transcoder.", error),
    );
    activeFfmpeg.on("close", (code) => {
      if (cancelled || responseDone) return;
      if (code !== 0) {
        fail("Audio transcoding failed.");
        return;
      }
      complete();
    });

    const ytDlpOutput = activeYtDlp.stdout;
    const ffmpegInput = activeFfmpeg.stdin;
    if (!ytDlpOutput || !ffmpegInput) {
      fail("Could not connect yt-dlp output to the audio transcoder.");
      return;
    }

    ytDlpOutput.pipe(ffmpegInput);
    streamProcessOutput(activeFfmpeg);
    return;
  }

  let targetFormat = formatId;
  if (["360", "480", "720", "1080", "1440", "2160"].includes(formatId)) {
    targetFormat = `bestvideo[height=${formatId}]+ba/best`;
  }

  const urlArgs = [
    ...baseArgs,
    "-f",
    targetFormat,
    "--get-url",
    "--",
    videoId,
  ];

  activeYtDlp = execFile(
    YTDLP_BINARY,
    urlArgs,
    { encoding: "utf8" },
    (error, stdout) => {
      activeYtDlp = null;
      if (!canRespond()) return;
      if (error) {
        fail(
          "Extraction error encountered while resolving stream URLs.",
          error,
        );
        return;
      }

      const lines = stdout.trim().split("\n");
      const videoUrl = lines[0];
      const audioUrl = lines[1] || videoUrl;
      if (!videoUrl) {
        fail("No stream URL was returned for the requested video.");
        return;
      }

      console.log(
        `[Download Controller] URLs resolved. Spawning synchronized H.264 multiplexer for ${formatId}.`,
      );

      activeFfmpeg = spawn("ffmpeg", [
        "-headers",
        `User-Agent: ${USER_AGENT}\r\n`,
        "-i",
        videoUrl,
        "-i",
        audioUrl,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "24",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-f",
        "mp4",
        "-movflags",
        "frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets",
        "pipe:1",
      ]);

      activeFfmpeg.stderr?.on("data", appendStderr);
      activeFfmpeg.on("error", (spawnError) =>
        fail("Failed to start the video transcoder.", spawnError),
      );
      activeFfmpeg.on("close", (code) => {
        if (cancelled || responseDone) return;
        if (code !== 0) {
          fail("Video transcoding failed.");
          return;
        }
        complete();
      });

      streamProcessOutput(activeFfmpeg);
    },
  );

  activeYtDlp.on("error", (error) =>
    fail("Failed to start yt-dlp to resolve stream URLs.", error),
  );
  activeYtDlp.stderr?.on("data", appendStderr);
};
