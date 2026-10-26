import { Request, Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import http from "http";
import https from "https";
import { YTDLP_BINARY, UNIVERSAL_EXTRACTOR_ARGS } from "../config/constants.js";

const execFileAsync = promisify(execFile);

export default async (req: Request, res: Response) => {
  const videoId = (req.params.id as string).trim();
  const rangeHeader = req.headers.range;

  if (!rangeHeader) {
    return res
      .status(400)
      .send("Requires HTTP Range Header for media streams.");
  }

  const args = [
    "-g",
    "-f",
    "b[ext=mp4]/best",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
    "--",
    videoId,
  ];
  console.log("[Stream Controller] Resolving target URL for: " + videoId);

  try {
    const { stdout } = await execFileAsync(YTDLP_BINARY, args);
    const lines = stdout.trim().split("\n");
    const finalUrl = lines[0];

    if (!finalUrl || !finalUrl.startsWith("http")) {
      return res
        .status(500)
        .json({ error: "Invalid proxy target URL resolved." });
    }

    const proxyRequestOptions = {
      headers: {
        Range: rangeHeader,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
    };

    const clientHttpModule = finalUrl.startsWith("https") ? https : http;

    const proxyReq = clientHttpModule.get(
      finalUrl,
      proxyRequestOptions,
      (proxyResponse) => {
        const statusCode = proxyResponse.statusCode || 206;
        res.writeHead(statusCode, proxyResponse.headers);
        proxyResponse.pipe(res);
      },
    );

    proxyReq.on("error", (proxyErr) => {
      console.error("[Stream Proxy Controller Error]:", proxyErr.message);
      if (!res.headersSent) res.sendStatus(500);
    });
  } catch (err: any) {
    console.error(
      "[Stream Controller Details Error]:",
      err.stderr || err.message,
    );
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to proxy streaming links.",
        debugMessage: err.stderr || err.message,
      });
    }
  }
};
