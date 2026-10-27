import { readFile, unlink } from "node:fs/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File as FormidableFile } from "formidable";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { canCreateArticles } from "../../../../utils/auth";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { logEvent } from "../../../../lib/server/logger";
import {
  MediaStorageError,
  describeFileHead,
  detectImageType,
  storeImage
} from "../../../../lib/server/media-storage";

export const config = {
  api: {
    bodyParser: false
  }
};

function readSingleFile(input: FormidableFile | FormidableFile[] | undefined) {
  if (!input) return null;
  return Array.isArray(input) ? input[0] || null : input;
}

function parseMultipart(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 8 * 1024 * 1024
  });

  return new Promise<{
    fields: formidable.Fields;
    files: formidable.Files;
  }>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!canCreateArticles(session.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-media",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many uploads from this connection. Please try again shortly."
  );
  if (!ok) return;

  let tempPath: string | null = null;

  try {
    const { fields, files } = await parseMultipart(req);
    const file = readSingleFile(files.file);

    if (!file) {
      return res.status(400).json({ error: "Choose an image to upload." });
    }

    tempPath = file.filepath;

    const folderInput = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
    const fileBuffer = await readFile(file.filepath);

    const detectedType = detectImageType(fileBuffer);
    if (!detectedType) {
      return res.status(400).json({ error: "Unsupported image. Please upload a JPG, PNG, WebP, GIF or AVIF file (iPhone HEIC photos need converting first).",
        ...(process.env.NODE_ENV !== "production" ? { detail: describeFileHead(fileBuffer) } : {})
      });
    }

    const stored = await storeImage({
      buffer: fileBuffer,
      folder: String(folderInput || "uploads"),
      originalName: file.originalFilename || "upload",
      mimetype: detectedType
    });

    return res.status(201).json({
      url: stored.url,
      pathname: stored.pathname
    });
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return res.status(error.status).json({
        error: error.message,
        ...(error.detail ? { detail: error.detail } : {})
      });
    }

    const code = (error as { httpCode?: number } | null)?.httpCode;
    if (code === 413) {
      return res.status(413).json({ error: "Image is too large. Please choose one under 8 MB." });
    }

    logEvent("error", "media.upload_failed", { error });
    return res.status(500).json({
      error: "Upload failed. Please try again.",
      ...(process.env.NODE_ENV !== "production" && error instanceof Error ? { detail: error.message } : {})
    });
  } finally {
    if (tempPath) {
      await unlink(tempPath).catch(() => undefined);
    }
  }
}