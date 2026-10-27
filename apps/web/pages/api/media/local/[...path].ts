import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { getLocalMediaRoot } from "../../../../lib/server/media-storage";
import { isHostedRuntime } from "../../../../lib/security/env";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif"
};

// Serves images saved by the local-disk upload fallback (development only).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  // On Vercel, uploads live in Blob storage; this route must never be used.
  if (isHostedRuntime()) {
    return res.status(404).end();
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : [String(req.query.path || "")];
  const contentType = CONTENT_TYPES[path.extname(segments[segments.length - 1] || "").toLowerCase()];

  if (!contentType || segments.some((segment) => !segment || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    return res.status(404).end();
  }

  const root = path.resolve(getLocalMediaRoot());
  const filePath = path.resolve(root, ...segments);

  // Block path traversal outside the uploads folder.
  if (!filePath.startsWith(root + path.sep)) {
    return res.status(404).end();
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return res.status(404).end();
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(info.size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    createReadStream(filePath).pipe(res);
  } catch {
    res.status(404).end();
  }
}