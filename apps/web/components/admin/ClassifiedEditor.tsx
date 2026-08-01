import { useRouter } from "next/router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CLASSIFIED_CATEGORY_OPTIONS } from "../../lib/classifieds-data";
import { canDeleteClassifieds, canPublishClassifieds } from "../../utils/auth";
import { slugify } from "../../utils/slug";
import { StatusBadge } from "./StatusBadge";
import { MediaUploadField } from "./MediaUploadField";

type ClassifiedInput = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  location: string;
  summary: string;
  description: string;
  image: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  featured: boolean;
  reviewNotes: string;
  status: string;
  submittedAt?: string | null;
  publishedAt?: string | null;
  expiresAt?: string;
};

type SaveAction = "draft" | "submit" | "publish" | "reject";

export function ClassifiedEditor({
  initialClassified,
  role,
  isNew
}: {
  initialClassified: ClassifiedInput;
  role: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [classified, setClassified] = useState(initialClassified);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<SaveAction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => JSON.stringify(initialClassified));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const canPublish = canPublishClassifieds(role);
  const canDelete = canDeleteClassifieds(role);
  const previewSlug = classified.slug || slugify(classified.title) || "classified";
  const previewPath = `/classifieds/${previewSlug}`;
  const descriptionWordCount = classified.description
    ? classified.description.split(/\s+/).filter(Boolean).length
    : 0;
  const hasUnsavedChanges = JSON.stringify(classified) !== lastSavedSnapshot;
  const readinessItems = [
    { label: "Title", ready: classified.title.trim().length >= 8 },
    { label: "Category", ready: classified.category.trim().length >= 2 },
    { label: "Price", ready: classified.price.trim().length >= 1 },
    { label: "Location", ready: classified.location.trim().length >= 2 },
    { label: "Summary", ready: classified.summary.trim().length >= 24 },
    { label: "Seller", ready: classified.sellerName.trim().length >= 2 && classified.sellerEmail.trim().length >= 5 },
    { label: "Description", ready: descriptionWordCount >= 20 }
  ];
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const completionPercent = Math.round((readyCount / readinessItems.length) * 100);

  function updateField<K extends keyof ClassifiedInput>(key: K, value: ClassifiedInput[K]) {
    setClassified((current) => ({ ...current, [key]: value }));
  }

  function fillSlugFromTitle() {
    updateField("slug", slugify(classified.title) || classified.slug);
  }

  async function save(action: SaveAction) {
    setBusy(true);
    setPendingAction(action);
    setMessage("");
    setError("");

    const endpoint = isNew ? "/api/admin/classifieds" : `/api/admin/classifieds/${classified.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...classified, action })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Unable to save this listing.");
        return;
      }

      if (isNew && data?.id) {
        await router.replace(`/admin/classifieds/${data.id}`);
        return;
      }

      setClassified(data);
      setLastSavedSnapshot(JSON.stringify(data));
      setMessage(
        action === "publish"
          ? "Listing is now live on the public classifieds section."
          : action === "submit"
          ? "Listing moved into review."
          : action === "reject"
          ? "Listing rejected and removed from public circulation."
          : "Draft saved."
      );
    } catch {
      setError("The save request could not be completed. Please try again.");
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function deleteListing() {
    if (!classified.id) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/classifieds/${classified.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setDeleteError(data?.error || "Unable to delete this listing.");
        setDeleting(false);
        return;
      }

      await router.push("/admin/classifieds");
    } catch {
      setDeleteError("The delete request could not be completed. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Classifieds desk</p>
            <h2 className="mt-2 font-news text-4xl text-zinc-950">
              {isNew ? "Create a listing" : "Moderate and publish"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
              Handle seller details, polish the public listing, and move it through draft, review, approval, or rejection from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={classified.status} />
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${hasUnsavedChanges ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved state"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Category" value={classified.category || "Choose"} helper="Marketplace desk" />
          <MetricCard label="Readiness" value={`${completionPercent}%`} helper={`${readyCount}/${readinessItems.length} checks ready`} />
          <MetricCard label="Description" value={`${descriptionWordCount} words`} helper="Enough detail for buyers" />
          <MetricCard
            label="Public path"
            value={previewPath}
            helper={classified.featured ? "Marked featured" : "Standard listing"}
            valueClassName="text-sm md:text-base break-all leading-snug"
          />
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.5rem] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[1.5rem] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Listing details</p>
                <h3 className="mt-2 font-news text-3xl text-zinc-950">What readers will see</h3>
              </div>

              <button
                type="button"
                onClick={fillSlugFromTitle}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
              >
                Generate slug
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Listing title</span>
                <input
                  value={classified.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-base"
                  placeholder="Write the listing headline"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Category</span>
                <select
                  value={classified.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                >
                  <option value="">Choose a category</option>
                  {CLASSIFIED_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Slug</span>
                <input
                  value={classified.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="listing-slug"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Price</span>
                <input
                  value={classified.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="GBP 495"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Location</span>
                <input
                  value={classified.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Canary Wharf"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Summary</span>
                <textarea
                  value={classified.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Short summary used on listing cards and previews."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Full description</span>
                <textarea
                  value={classified.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Add the full listing description. Use blank lines to separate paragraphs."
                />
              </label>

              <div className="block md:col-span-2">
                <MediaUploadField
                  label="Image URL"
                  value={classified.image}
                  onChange={(value) => updateField("image", value)}
                  folder="classifieds"
                  helperText="Upload a listing image to Blob storage or paste an existing image URL."
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Seller and moderation</p>
            <h3 className="mt-2 font-news text-3xl text-zinc-950">Contact and review controls</h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Seller name</span>
                <input
                  value={classified.sellerName}
                  onChange={(event) => updateField("sellerName", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Seller email</span>
                <input
                  value={classified.sellerEmail}
                  onChange={(event) => updateField("sellerEmail", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Seller phone</span>
                <input
                  value={classified.sellerPhone}
                  onChange={(event) => updateField("sellerPhone", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Expires on</span>
                <input
                  type="date"
                  value={classified.expiresAt || ""}
                  onChange={(event) => updateField("expiresAt", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Review notes</span>
                <textarea
                  value={classified.reviewNotes}
                  onChange={(event) => updateField("reviewNotes", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Internal moderation notes for approvals, edits, or rejections."
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={classified.featured}
                  onChange={(event) => updateField("featured", event.target.checked)}
                />
                <span className="text-sm text-zinc-700">Feature on the classifieds landing page</span>
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Public preview</p>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-stone-50">
              <div className="relative min-h-[180px]">
                {classified.image ? (
                  <img src={classified.image} alt={classified.title || "Classified listing"} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-zinc-200" />
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  <span>{classified.category || "Category"}</span>
                  <span>{classified.location || "Location"}</span>
                </div>
                <h3 className="font-news text-3xl leading-tight text-zinc-950">
                  {classified.title || "Listing headline preview"}
                </h3>
                <p className="text-sm leading-7 text-zinc-700">
                  {classified.summary || "A concise classifieds summary will appear here once you start writing."}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold text-zinc-950">{classified.price || "Price"}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{previewPath}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Publishing actions</p>
            <div className="mt-4 space-y-3">
              <ActionButton
                label={pendingAction === "draft" ? "Saving..." : "Save draft"}
                onClick={() => save("draft")}
                disabled={busy || classified.title.trim().length < 6}
                tone="secondary"
              />
              <ActionButton
                label={pendingAction === "submit" ? "Sending..." : "Send to review"}
                onClick={() => save("submit")}
                disabled={busy || classified.title.trim().length < 6}
                tone="secondary"
              />
              <ActionButton
                label={pendingAction === "publish" ? "Publishing..." : canPublish ? "Publish listing" : "Publishing unavailable"}
                onClick={() => save("publish")}
                disabled={busy || !canPublish || readyCount < readinessItems.length - 1}
                tone="primary"
              />
              {!isNew ? (
                <ActionButton
                  label={pendingAction === "reject" ? "Rejecting..." : "Reject listing"}
                  onClick={() => save("reject")}
                  disabled={busy}
                  tone="danger"
                />
              ) : null}
            </div>
          </section>

          {!isNew && canDelete ? (
            <section className="rounded-[2rem] border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.24em] text-rose-600">Danger zone</p>
              <h3 className="mt-2 font-news text-2xl text-zinc-950">Delete this listing</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Permanently remove this classified from the desk and the public site. This action cannot be undone.
              </p>

              {deleteError ? (
                <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {deleteError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setConfirmingDelete(true);
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                Delete listing
              </button>
            </section>
          ) : null}
        </aside>
      </div>

      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-rose-600">Confirm delete</p>
            <h2 className="mt-2 font-news text-2xl text-zinc-950">Delete this listing?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              You are about to permanently delete{" "}
              <span className="font-semibold text-zinc-900">&ldquo;{classified.title || "this listing"}&rdquo;</span>. This cannot be undone
              and will remove it from the public classifieds section.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteListing}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  valueClassName
}: {
  label: string;
  value: string;
  helper: string;
  valueClassName?: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className={`mt-2 break-words font-semibold text-zinc-950 ${valueClassName || "text-2xl"}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{helper}</p>
    </article>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "primary" | "secondary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-zinc-950 text-white"
      : tone === "danger"
      ? "border border-rose-300 text-rose-700"
      : "border border-zinc-300 text-zinc-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50 ${toneClass}`}
    >
      {label}
    </button>
  );
}