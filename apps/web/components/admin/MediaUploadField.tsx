import { useId, useState } from "react";

// Vercel serverless functions reject request bodies above ~4.5 MB.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function MediaUploadField({
  label,
  value,
  onChange,
  folder,
  placeholder = "https://...",
  helperText
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: string;
  placeholder?: string;
  helperText?: string;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(file: File | undefined, input: HTMLInputElement | null) {
    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP, GIF or AVIF).");
      if (input) input.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large. Please choose one under 4 MB.");
      if (input) input.value = "";
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
        credentials: "same-origin"
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 413) {
          setError("Image is too large. Please choose one under 4 MB.");
        } else {
          setError([data?.error || "Upload failed.", data?.detail].filter(Boolean).join(" - "));
        }
        return;
      }

      onChange(data.url || "");
      setMessage("Image uploaded.");
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      // Allow picking the same file again after a failure.
      if (input) input.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </label>
        <label className="cursor-pointer rounded-full border border-zinc-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-950">
          {uploading ? "Uploading..." : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            disabled={uploading}
            onChange={(event) => void handleUpload(event.target.files?.[0], event.target)}
          />
        </label>
      </div>

      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
        placeholder={placeholder}
      />

      {helperText ? <p className="text-xs leading-6 text-zinc-500">{helperText}</p> : null}
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}