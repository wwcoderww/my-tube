import { Request, Response } from "express";
import { spawn } from "child_process";
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

  const args = [
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "--no-check-certificates",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
  ];

  if (isAudio) {
    args.push("-f", "ba/bestaudio");
  } else if (["360", "480", "720", "1080", "1440", "2160"].includes(formatId)) {
    args.push("-f", `bestvideo[height=${formatId}]+ba/best`);
    args.push("--merge-output-format", "mp4");
  } else {
    args.push("-f", formatId);
  }

  args.push("-o", "-", "--", videoId);

  // Live MP3 Re-encoding pipeline branch
  if (fileExt === "mp3") {
    console.log(
      `[Download Controller] Initializing transcoding pipe for MP3 conversion...`,
    );
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
  } else {
    console.log(
      `[Download Controller] Executing standard passthrough stream for: ${formatId}`,
    );
    const child = spawn(YTDLP_BINARY, args);

    child.stdout.on("data", (chunk: Buffer) => {
      if (!headersSent) {
        headersSent = true;
        res.writeHead(200, {
          "Content-Type": contentType,
          "Content-Disposition":
            'attachment; filename="' + safeTitle + "." + fileExt + '"',
          "Cache-Control": "no-cache",
        });
      }
      res.write(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    child.on("exit", () => {
      child.kill();
      res.end();
    });
  }
};
