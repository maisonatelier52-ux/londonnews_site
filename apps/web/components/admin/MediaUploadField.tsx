import { useId, useState } from "react";

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

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Upload failed.");
        return;
      }

      onChange(data.url || "");
      setMessage("Image uploaded.");
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
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
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => void handleUpload(event.target.files?.[0])}
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
