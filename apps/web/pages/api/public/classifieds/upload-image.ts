import { readFile, unlink } from "node:fs/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File as FormidableFile } from "formidable";
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
    maxFileSize: 5 * 1024 * 1024
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

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "classified-upload-image",
      max: 10,
      windowMs: 60 * 60 * 1000
    },
    "Too many image uploads from this connection. Please try again later."
  );
  if (!ok) return;

  let tempPath: string | null = null;

  try {
    const { files } = await parseMultipart(req);
    const file = readSingleFile(files.file);

    if (!file) {
      return res.status(400).json({ error: "Choose an image to upload." });
    }

    tempPath = file.filepath;

    const fileBuffer = await readFile(file.filepath);

    const detectedType = detectImageType(fileBuffer);
    if (!detectedType) {
      return res.status(400).json({ error: "Unsupported image. Please upload a JPG, PNG, WebP, GIF or AVIF file (iPhone HEIC photos need converting first).",
        ...(process.env.NODE_ENV !== "production" ? { detail: describeFileHead(fileBuffer) } : {})
      });
    }

    const stored = await storeImage({
      buffer: fileBuffer,
      folder: "classifieds",
      originalName: file.originalFilename || "upload",
      mimetype: detectedType
    });

    return res.status(201).json({
      url: stored.url,
      pathname: stored.pathname
    });
  } catch (error) {
    if (error instanceof MediaStorageError) {
      return res.status(error.status).json({ error: error.message });
    }

    const code = (error as { httpCode?: number } | null)?.httpCode;
    if (code === 413) {
      return res.status(413).json({ error: "Image is too large. Please choose one under 5 MB." });
    }

    logEvent("error", "classifieds.image_upload_failed", { error });
    return res.status(500).json({ error: "Upload failed. Please try again." });
  } finally {
    if (tempPath) {
      await unlink(tempPath).catch(() => undefined);
    }
  }
}