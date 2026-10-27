import { Request, Response } from "express";
import { spawn, execFile } from "child_process";
import { YTDLP_BINARY, UNIVERSAL_EXTRACTOR_ARGS } from "../config/constants.js";

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

  const safeTitle = videoTitle.replace(/[/\\?%*:|"<>]/g, "-").trim();
  let stderrData = "";
  let headersSent = false;

  const isAudio =
    ["m4a", "mp3", "opus", "webm"].includes(fileExt) || formatId === "audio";
  const contentType =
    fileExt === "mp3" ? "audio/mpeg" : isAudio ? "audio/mp4" : "video/mp4";

  // Base network configuration arguments for yt-dlp
  const baseArgs = [
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "--no-check-certificates",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
  ];

  // Live MP3 Re-encoding pipeline branch
  if (fileExt === "mp3") {
    console.log(
      `[Download Controller] Initializing transcoding pipe for MP3 conversion...`,
    );
    const args = [...baseArgs, "-f", "ba/bestaudio", "-o", "-", "--", videoId];

    const ytDlpProcess = spawn(YTDLP_BINARY, args);
    const ffmpegProcess = spawn("ffmpeg", [
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

    ytDlpProcess.stdout.pipe(ffmpegProcess.stdin);

    ffmpegProcess.stdout.on("data", (chunk: Buffer) => {
      if (!headersSent) {
        headersSent = true;
        res.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'attachment; filename="' + safeTitle + '.mp3"',
          "Cache-Control": "no-cache",
        });
      }
      res.write(chunk);
    });

    ytDlpProcess.stderr.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    ffmpegProcess.on("close", () => {
      ytDlpProcess.kill();
      ffmpegProcess.kill();
      res.end();
    });

    // Visual Streaming Pipeline via Direct URL Multiplexing & Uniform H.264 Encoding
  } else {
    console.log(
      `[Download Controller] Resolving streaming URLs for real-time multiplexing: ${formatId}`,
    );

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

    execFile(YTDLP_BINARY, urlArgs, (error, stdout) => {
      if (error) {
        console.error(
          "[Download Controller] Failed to extract stream URLs:",
          error,
        );
        return res
          .status(500)
          .send("Extraction error encountered while resolving stream URLs.");
      }

      const lines = stdout.trim().split("\n");
      const videoUrl = lines[0];
      const audioUrl = lines[1] || lines[0];

      console.log(
        `[Download Controller] URLs resolved. Spawning synchronized H.264 multiplexer...`,
      );

      const ffmpegProcess = spawn("ffmpeg", [
        "-headers",
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n`,
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

      ffmpegProcess.stdout.on("data", (chunk: Buffer) => {
        if (!headersSent) {
          headersSent = true;
          res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${safeTitle}.${fileExt}"`,
            "Cache-Control": "no-cache",
          });
        }
        res.write(chunk);
      });

      ffmpegProcess.stderr.on("data", (chunk: Buffer) => {
        stderrData += chunk.toString();
      });

      ffmpegProcess.on("close", () => {
        ffmpegProcess.kill();
        res.end();
      });
    });
  }
};
