import { readFile } from "node:fs/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File as FormidableFile } from "formidable";
import { put } from "@vercel/blob";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { logEvent } from "../../../../lib/server/logger";

export const config = {
  api: {
    bodyParser: false
  }
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Blob storage is not configured." });
  }

  try {
    const { files } = await parseMultipart(req);
    const file = readSingleFile(files.file);

    if (!file) {
      return res.status(400).json({ error: "Choose an image to upload." });
    }

    if (!file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are supported." });
    }

    const originalName = sanitizeFilename(file.originalFilename || "upload");
    const fileBuffer = await readFile(file.filepath);

    const blob = await put(`classifieds/${originalName}`, fileBuffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.mimetype || undefined
    });

    return res.status(201).json({
      url: blob.url,
      pathname: blob.pathname
    });
  } catch (error) {
    logEvent("error", "classifieds.image_upload_failed", { error });
    return res.status(500).json({ error: "Upload failed. Please try again." });
  }
}