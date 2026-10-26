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

    const progressive: any[] = [];
    const videoOnly: any[] = [];
    const audioOnly: any[] = [];
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
        if (langMatch && langMatch) language = langMatch[1];
      } else if (f.language) {
        language = f.language;
      }

      const isEnglish = language.startsWith("en");

      const formatOption = {
        formatId: f.format_id,
        ext: f.ext,
        resolution:
          f.resolution ||
          (f.width && f.height ? `${f.width}x${f.height}` : "unknown"),
        height: f.height || 0,
        fps: f.fps || null,
        audioBitrate: f.abr || null,
        videoBitrate: f.vbr || null,
        container: f.container || f.ext,
        language: language,
        url: f.url,
        filesize: f.filesize || f.filesize_approx || null,
      };

      if (f.vcodec !== "none" && f.acodec !== "none") {
        progressive.push(formatOption);
      } else if (f.vcodec !== "none" && f.acodec === "none") {
        videoOnly.push(formatOption);
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
      thumbnail:
        metadata.thumbnail ||
        (metadata.thumbnails && metadata.thumbnails[0]?.url) ||
        null,
      description: metadata.description || "",
      downloadOptions: {
        combined: progressive.sort((a, b) => (b.height || 0) - (a.height || 0)),
        videoOnly: videoOnly.sort((a, b) => (b.height || 0) - (a.height || 0)),
        audioOnly: audioOnly.sort(
          (a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0),
        ),
      },
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
