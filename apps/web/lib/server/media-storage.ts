import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { isHostedRuntime } from "../security/env";
import { logEvent } from "./logger";

/**
 * Image types we accept from the admin panel / classifieds form.
 * SVG is deliberately excluded: it can carry scripts and would be served
 * from our own origin when stored locally.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
};

const BLOB_TIMEOUT_MS = 15_000;

export const LOCAL_MEDIA_ROUTE_PREFIX = "/api/media/local";

/** Where files are written when Vercel Blob is not available (local dev). */
export function getLocalMediaRoot() {
  return path.join(process.cwd(), ".local-uploads");
}

// Vercel Blob retries internally, so a plain abort signal is not enough to
// guarantee a fast failure. Race the call against a timer as well.
function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void) {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`Blob upload timed out after ${ms / 1000}s`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class MediaStorageError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MediaStorageError";
    this.status = status;
  }
}

export function sanitizeSegment(value: string, fallback: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+/, "")
    .slice(0, 80);

  return cleaned || fallback;
}

/** Short description of a file's first bytes, for diagnosing rejected uploads. */
export function describeFileHead(buffer: Buffer) {
  const hex = Array.from(buffer.subarray(0, 16)).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  return `received ${buffer.length} bytes, starting with: ${hex || "(empty)"}`;
}

export function isAllowedImageType(mimetype: string | null | undefined) {
  return Boolean(mimetype && ALLOWED_IMAGE_TYPES[mimetype.toLowerCase()]);
}

/**
 * Work out the real image type from the file's own bytes. The browser's
 * reported type is only a guess from the file extension (an image saved as
 * ".jpg" can really be WebP/AVIF), so we never trust it.
 */
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";

  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    // AVIF may use "mif1"/"miaf" as the main brand and list "avif" as a
    // compatible brand, so scan the whole ftyp box rather than one field.
    const boxSize = Math.min(buffer.readUInt32BE(0) || 64, 128, buffer.length);
    const brands = buffer.subarray(8, boxSize).toString("ascii");
    if (brands.includes("avif") || brands.includes("avis")) return "image/avif";
  }

  return null;
}

async function saveLocally(folder: string, fileName: string, buffer: Buffer) {
  const dir = path.join(getLocalMediaRoot(), folder);
  await mkdir(dir, { recursive: true });

  const storedName = `${randomBytes(6).toString("hex")}-${fileName}`;
  await writeFile(path.join(dir, storedName), buffer);

  return {
    url: `${LOCAL_MEDIA_ROUTE_PREFIX}/${folder}/${storedName}`,
    pathname: `${folder}/${storedName}`
  };
}

export async function storeImage({
  buffer,
  folder,
  originalName,
  mimetype
}: {
  buffer: Buffer;
  folder: string;
  originalName: string;
  mimetype: string;
}) {
  const safeFolder = sanitizeSegment(folder, "uploads");
  const baseName = sanitizeSegment(originalName, "upload");
  const extension = ALLOWED_IMAGE_TYPES[mimetype.toLowerCase()] || "";
  // Replace whatever extension the file had with the one matching its real type.
  const fileName = `${baseName.replace(/\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?)$/i, "") || "upload"}${extension}`;
  const hosted = isHostedRuntime();
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (hasBlobToken) {
    try {
      const controller = new AbortController();
      const blob = await withTimeout(
        put(`${safeFolder}/${fileName}`, buffer, {
          access: "public",
          addRandomSuffix: true,
          contentType: mimetype,
          abortSignal: controller.signal
        }),
        BLOB_TIMEOUT_MS,
        () => controller.abort()
      );

      return { url: blob.url, pathname: blob.pathname, storage: "blob" as const };
    } catch (error) {
      logEvent("error", "media.blob_put_failed", { error, folder: safeFolder });

      // On Vercel the disk is read-only, so there is nothing to fall back to.
      if (hosted) {
        throw new MediaStorageError(
          "Image storage rejected the upload. Check that BLOB_READ_WRITE_TOKEN is valid for this environment.",
          502
        );
      }

      logEvent("warn", "media.falling_back_to_local_disk", { folder: safeFolder });
    }
  } else if (hosted) {
    throw new MediaStorageError("Blob storage is not configured.", 503);
  }

  // Local development: no usable Blob token, so keep the file on disk.
  const saved = await saveLocally(safeFolder, fileName, buffer);
  return { ...saved, storage: "local" as const };
}