import { Request, Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import { UNIVERSAL_EXTRACTOR_ARGS, YTDLP_BINARY } from "../config/constants.js";

const execFileAsync = promisify(execFile);

export default async (req: Request, res: Response) => {
  const videoId = (req.params.id as string).trim();
  console.log("[Metadata Controller] Processing lookup for: " + videoId);

  const args = [
    "--dump-json",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
    "--",
    videoId,
  ];

  try {
    const { stdout } = await execFileAsync(YTDLP_BINARY, args, {
      maxBuffer: 1024 * 1024 * 15,
    });
    const metadata = JSON.parse(stdout);

    const videoOptions: any[] = [];
    const audioOnly: any[] = [];
    const seenVideoHeights = new Set<number>();
    const seenAudioTracks = new Set<string>();

    const sortedFormats = metadata.formats.sort((a: any, b: any) => {
      const bBitrate = b.abr || b.vbr || b.tbr || 0;
      const aBitrate = a.abr || a.vbr || a.tbr || 0;
      return bBitrate - aBitrate;
    });

    sortedFormats.forEach((f: any) => {
      let language = "en";
      if (f.xtags) {
        const langMatch = f.xtags.match(/lang=([^&]+)/);
        if (langMatch && langMatch) language = langMatch;
      } else if (f.language) {
        language = f.language;
      }

      const isEnglish = language.startsWith("en");
      const height = f.height || 0;

      const formatOption = {
        formatId: f.format_id,
        ext: f.ext,
        resolution:
          f.resolution ||
          (f.width && f.height ? `${f.width}x${f.height}` : "unknown"),
        height: height,
        fps: f.fps || null,
        container: f.container || f.ext,
        filesize: f.filesize || f.filesize_approx || null,
      };

      if (f.vcodec !== "none" && height > 0) {
        if (!seenVideoHeights.has(height)) {
          seenVideoHeights.add(height);
          videoOptions.push(formatOption);
        }
      } else if (f.vcodec === "none" && f.acodec !== "none" && isEnglish) {
        const approxBitrateGroup = Math.round((f.abr || 0) / 10) * 10;
        const dedupeKey = `${f.ext}-${approxBitrateGroup}`;

        if (!seenAudioTracks.has(dedupeKey)) {
          seenAudioTracks.add(dedupeKey);
          audioOnly.push(formatOption);
        }
      }
    });

    return res.json({
      id: metadata.id,
      title: metadata.title,
      uploader: metadata.uploader,
      duration: metadata.duration,
      views: metadata.view_count || 0,
      thumbnail:
        metadata.thumbnail ||
        (metadata.thumbnails && metadata.thumbnails?.url) ||
        null,
      description: metadata.description || "",
      downloadOptions: {
        video: videoOptions.sort((a, b) => b.height - a.height),
        audio: audioOnly.sort((a, b) => b.audioBitrate - a.audioBitrate),
      },
      metadata,
    });
  } catch (err: any) {
    console.error("[Metadata Controller Error]:", err.stderr || err.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to extract video metadata options.",
        debugMessage: err.stderr || err.message,
      });
    }
  }
};
