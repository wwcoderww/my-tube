import { Request, Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
import { YTDLP_BINARY, UNIVERSAL_EXTRACTOR_ARGS } from "../config/constants.js";
import { GlobalError, SearchResult } from "@project/types";

const execFileAsync = promisify(execFile);

export default async (
  req: Request,
  res: Response<SearchResult[] | GlobalError>,
) => {
  const queryTerm = req.query.q as string;
  const queryAmt = req.query.amt as string;

  if (!queryTerm || !queryTerm.trim()) {
    return res
      .status(400)
      .json({ error: 'Missing or empty search query parameter "q".' });
  }

  const maxResults = queryAmt || 15;
  const searchSyntax = `ytsearch${maxResults}:${queryTerm.trim()}`;

  console.log(
    `[Search Controller] Querying cluster for term: "${queryTerm.trim()}"`,
  );

  const args = [
    "--dump-json",
    "--flat-playlist",
    "--extractor-args",
    UNIVERSAL_EXTRACTOR_ARGS,
    "--",
    searchSyntax,
  ];

  try {
    const { stdout } = await execFileAsync(YTDLP_BINARY, args, {
      maxBuffer: 1024 * 1024 * 15,
    });

    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");

    const resultsGrid = lines.map((line) => {
      const parsedItem = JSON.parse(line);
      return {
        id: parsedItem.id,
        title: parsedItem.title,
        uploader:
          parsedItem.uploader || parsedItem.channel || "Unknown Channel",
        duration: parsedItem.duration || null,
        views: parsedItem.view_count || 0,
        thumbnail:
          parsedItem.thumbnail ||
          (parsedItem.thumbnails && parsedItem.thumbnails[0]?.url) ||
          null,
        url: parsedItem.url,
      };
    });

    return res.json(resultsGrid);
  } catch (err: any) {
    console.error("[Search Controller Error]:", err.stderr || err.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to extract search data results.",
        debugMessage: err.stderr || err.message,
      });
    }
  }
};
