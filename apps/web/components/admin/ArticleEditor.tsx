import { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
import { ArticleBody } from "../editorial/ArticleBody";
import { StoryBlocksEditor } from "./StoryBlocksEditor";
import type { BodyBlock } from "../../lib/cms-types";
import { bodyBlocksToLegacyContent, bodyBlocksToPlainText } from "../../lib/articles/blocks";
import { truncate } from "../../lib/cms/utils";
import { getPreferredArticlePath } from "../../lib/legacy-routes";
import { slugify } from "../../utils/slug";
import { canDeleteArticles, canPublishArticles, canReviewArticles } from "../../utils/auth";
import { StatusBadge } from "./StatusBadge";
import { MediaUploadField } from "./MediaUploadField";

type SectionOption = {
  id: string;
  name: string;
  slug: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type ArticleRevisionInput = {
  id: string;
  action: string;
  note?: string | null;
  createdAt: string;
  createdByName?: string | null;
};

type ArticleCorrectionInput = {
  id: string;
  note: string;
  createdAt: string;
  createdByName?: string | null;
};

type ArticleInput = {
  id?: string;
  title: string;
  sectionId: string;
  dek: string;
  excerpt: string;
  heroImage: string;
  heroAlt: string;
  content: string;
  contentBlocks: BodyBlock[];
  status: string;
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
  scheduledUnpublishAt?: string | null;
  previewToken?: string;
  previewUrl?: string;
  seo: {
    slug: string;
    metaTitle: string;
    metaDesc: string;
    canonical: string;
    socialTitle: string;
    socialDescription: string;
    socialImage: string;
    noindex: boolean;
  };
  revisions?: ArticleRevisionInput[];
  corrections?: ArticleCorrectionInput[];
};

type PreviewMode = "write" | "split" | "preview";
type SaveAction = "draft" | "submit" | "publish" | "unpublish";

function getRevalidationWarning(data: any) {
  const criticalFailures = Array.isArray(data?.revalidation?.criticalFailures)
    ? data.revalidation.criticalFailures.length
    : 0;
  const warmFailures = Array.isArray(data?.revalidation?.warmFailures)
    ? data.revalidation.warmFailures.length
    : 0;

  if (criticalFailures === 0 && warmFailures === 0) {
    return "";
  }

  return " Public article refresh is delayed. Check the revalidation logs before sharing the updated page.";
}

export function ArticleEditor({
  initialArticle,
  sections,
  role,
  isNew
}: {
  initialArticle: ArticleInput;
  sections: SectionOption[];
  role: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [article, setArticle] = useState(initialArticle);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("split");
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<SaveAction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => JSON.stringify(initialArticle));
  const [scheduledPublishInput, setScheduledPublishInput] = useState(() =>
    toDateTimeLocalValue(initialArticle.scheduledPublishAt)
  );
  const [scheduledUnpublishInput, setScheduledUnpublishInput] = useState(() =>
    toDateTimeLocalValue(initialArticle.scheduledUnpublishAt)
  );
  const [correctionNote, setCorrectionNote] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function formatSectionLabel(section?: SectionOption | null) {
    if (!section) return "Unassigned";
    return section.parent ? `${section.parent.name} -> ${section.name}` : section.name;
  }

  const canReview = canReviewArticles(role);
  const canPublish = canPublishArticles(role);
  const canDelete = canDeleteArticles(role);
  const selectedSection = sections.find((section) => section.id === article.sectionId);
  const groupedSections = sections
    .filter((section) => !section.parent)
    .map((section) => ({
      root: section,
      children: sections.filter((item) => item.parent?.id === section.id)
    }));
  const sectionLabel = formatSectionLabel(selectedSection);
  const previewBlocks = article.contentBlocks || [];
  const plainBody = bodyBlocksToPlainText(previewBlocks);
  const excerptFallback =
    article.excerpt ||
    article.dek ||
    truncate(plainBody || "Add a short summary for homepage cards and previews.", 180);
  const metaTitleFallback = article.seo.metaTitle || article.title || "Untitled story";
  const metaDescFallback =
    article.seo.metaDesc ||
    article.dek ||
    article.excerpt ||
    truncate(plainBody || "Add a concise SEO description for this story.", 160);
  const previewSlug = article.seo.slug || slugify(article.title) || "story-slug";
  const publicPath = getPreferredArticlePath({
    slug: previewSlug,
    section: selectedSection || null
  });
  const previewUrl = article.previewUrl || "";
  const wordCount = plainBody ? plainBody.split(/\s+/).filter(Boolean).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(Math.max(wordCount, 1) / 220));
  const hasUnsavedChanges = JSON.stringify(article) !== lastSavedSnapshot;
  const canAttemptSave = article.title.trim().length >= 3 && previewBlocks.length > 0 && wordCount >= 20;
  const readinessItems = [
    { label: "Headline", ready: article.title.trim().length >= 8 },
    { label: "Section", ready: Boolean(article.sectionId) },
    { label: "Standfirst", ready: article.dek.trim().length >= 25 },
    { label: "Excerpt", ready: excerptFallback.trim().length >= 40 },
    { label: "Hero image", ready: Boolean(article.heroImage.trim()) },
    { label: "Body draft", ready: wordCount >= 120 },
    { label: "SEO description", ready: metaDescFallback.trim().length >= 80 }
  ];
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const completionPercent = Math.round((readyCount / readinessItems.length) * 100);

  function updateArticle<K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) {
    setArticle((current) => ({ ...current, [key]: value }));
  }

  function updateSeo<K extends keyof ArticleInput["seo"]>(key: K, value: ArticleInput["seo"][K]) {
    setArticle((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [key]: value
      }
    }));
  }

  function updateBodyBlocks(blocks: BodyBlock[]) {
    setArticle((current) => ({
      ...current,
      contentBlocks: blocks,
      content: bodyBlocksToLegacyContent(blocks)
    }));
  }

  function fillSlugFromHeadline() {
    updateSeo("slug", slugify(article.title) || article.seo.slug);
  }

  function fillExcerptFromStory() {
    updateArticle("excerpt", truncate(article.dek || plainBody, 180));
  }

  function fillSeoFromStory() {
    updateSeo("metaTitle", truncate(article.title, 65));
    updateSeo("metaDesc", truncate(article.dek || article.excerpt || plainBody, 160));
    updateSeo("socialTitle", truncate(article.title, 95));
    updateSeo("socialDescription", truncate(article.dek || article.excerpt || plainBody, 200));
    if (!article.seo.canonical) {
      updateSeo("canonical", publicPath);
    }
    if (article.heroImage && !article.seo.socialImage) {
      updateSeo("socialImage", article.heroImage);
    }
  }

  function applyServerArticle(nextArticle: ArticleInput) {
    setArticle(nextArticle);
    setLastSavedSnapshot(JSON.stringify(nextArticle));
    setScheduledPublishInput(toDateTimeLocalValue(nextArticle.scheduledPublishAt));
    setScheduledUnpublishInput(toDateTimeLocalValue(nextArticle.scheduledUnpublishAt));
  }

  async function save(action: SaveAction) {
    setBusy(true);
    setPendingAction(action);
    setMessage("");
    setError("");

    const endpoint = isNew ? "/api/admin/articles" : `/api/admin/articles/${article.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...article, action })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Unable to save the article.");
        return;
      }

      if (isNew && data?.id) {
        await router.replace(`/admin/articles/${data.id}`);
        return;
      }

      const { revalidation: _revalidation, ...nextArticle } = data || {};
      applyServerArticle(nextArticle as ArticleInput);
      const revalidationWarning = getRevalidationWarning(data);
      setMessage(
        (action === "publish"
          ? "Article published and ready for the public site."
          : action === "unpublish"
          ? "Article removed from the public site."
          : action === "submit"
          ? canReview
            ? "Approved and moved forward for the desk."
            : "Article submitted for editorial review."
          : "Draft saved.") + revalidationWarning
      );
    } catch {
      setError("The save request could not be completed. Please try again.");
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function deleteArticle() {
    if (!article.id) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || "Unable to delete this article.");
        setDeleting(false);
        return;
      }

      await router.push("/admin/articles");
    } catch {
      setDeleteError("The delete request could not be completed. Please try again.");
      setDeleting(false);
    }
  }

  async function saveSchedule(options?: {
    clearPublishSchedule?: boolean;
    clearUnpublishSchedule?: boolean;
  }) {
    if (!article.id) {
      setError("Save the article once before setting a publication schedule.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/admin/articles/${article.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledPublishAt:
            options?.clearPublishSchedule ? null : fromDateTimeLocalValue(scheduledPublishInput),
          scheduledUnpublishAt:
            options?.clearUnpublishSchedule ? null : fromDateTimeLocalValue(scheduledUnpublishInput),
          clearPublishSchedule: options?.clearPublishSchedule || false,
          clearUnpublishSchedule: options?.clearUnpublishSchedule || false
        })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Unable to update the article schedule.");
        return;
      }

      applyServerArticle(data);
      setMessage("Publication schedule updated.");
    } catch {
      setError("The schedule request could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addCorrection() {
    if (!article.id) {
      setError("Save the article once before adding a correction note.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/admin/articles/${article.id}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: correctionNote })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Unable to add the correction note.");
        return;
      }

      const { revalidation: _revalidation, ...nextArticle } = data || {};
      applyServerArticle(nextArticle as ArticleInput);
      setCorrectionNote("");
      setMessage(`Correction note published.${getRevalidationWarning(data)}`);
    } catch {
      setError("The correction note could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Editor workspace</p>
            <h2 className="mt-2 font-news text-4xl text-zinc-950">
              {isNew ? "Story drafting desk" : "Story refinement desk"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
              Shape the story, check the public-facing preview, and send it through the newsroom workflow from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={article.status} />
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${hasUnsavedChanges ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved state"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Section" value={sectionLabel} helper={article.sectionId ? "Mapped to public navigation" : "Choose a desk"} />
          <MetricCard label="Words" value={String(wordCount)} helper={`${readingMinutes} min read`} />
          <MetricCard label="Readiness" value={`${completionPercent}%`} helper={`${readyCount}/${readinessItems.length} story checks ready`} />
                  <MetricCard label="Public path" value={publicPath} helper={article.seo.noindex ? "Noindex enabled" : "Indexable when published"} />
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
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Story setup</p>
                <h3 className="mt-2 font-news text-3xl text-zinc-950">Publishing details</h3>
              </div>

              <button
                type="button"
                onClick={fillSeoFromStory}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
              >
                Fill search fields from story
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Headline</span>
                  <span className={`text-xs ${countTone(article.title.length, 70)}`}>{article.title.length}/70</span>
                </div>
                <input
                  value={article.title}
                  onChange={(event) => updateArticle("title", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-base"
                  placeholder="Write the story headline"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Section</span>
                <select
                  value={article.sectionId}
                  onChange={(event) => updateArticle("sectionId", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                >
                  <option value="">Choose a section</option>
                  {groupedSections.map(({ root, children }) => (
                    <Fragment key={root.id}>
                      <option value={root.id}>{root.name}</option>
                      {children.length > 0 ? (
                        <optgroup label={`${root.name} topics`}>
                          {children.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </Fragment>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO slug</span>
                  <button
                    type="button"
                    onClick={fillSlugFromHeadline}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 underline decoration-zinc-300 underline-offset-4"
                  >
                    Generate from headline
                  </button>
                </div>
                <input
                  value={article.seo.slug}
                  onChange={(event) => updateSeo("slug", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="story-slug"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Standfirst / dek</span>
                  <span className={`text-xs ${countTone(article.dek.length, 180)}`}>{article.dek.length}/180</span>
                </div>
                <textarea
                  value={article.dek}
                  onChange={(event) => updateArticle("dek", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Write the standfirst that sells the story at a glance."
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Short excerpt</span>
                  <button
                    type="button"
                    onClick={fillExcerptFromStory}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 underline decoration-zinc-300 underline-offset-4"
                  >
                    Generate from story
                  </button>
                </div>
                <textarea
                  value={article.excerpt}
                  onChange={(event) => updateArticle("excerpt", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Used on cards, lists, and homepage surfaces."
                />
              </label>

              <div className="block">
                <MediaUploadField
                  label="Hero image URL"
                  value={article.heroImage}
                  onChange={(value) => updateArticle("heroImage", value)}
                  folder="articles"
                  helperText="Upload directly to Blob storage or paste a trusted image URL."
                />
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Hero alt text</span>
                <input
                  value={article.heroAlt}
                  onChange={(event) => updateArticle("heroAlt", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Describe the image for accessibility"
                />
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-stone-50">
              {article.heroImage ? (
                <img src={article.heroImage} alt={article.heroAlt || article.title || "Hero image preview"} className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-zinc-500">
                  Add a hero image URL to preview the top-of-story treatment.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Story body</p>
                <h3 className="mt-2 font-news text-3xl text-zinc-950">Structured blocks and preview</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-700">
                  Build the story with ordered content blocks for paragraphs, subheads, quotes, images, embeds, and related links.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["write", "split", "preview"] as PreviewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewMode(mode)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                      previewMode === mode ? "bg-zinc-950 text-white" : "border border-zinc-300 text-zinc-700"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className={`mt-6 ${previewMode === "split" ? "grid gap-5 grid-cols-1" : "space-y-5"}`}>
              {previewMode !== "preview" ? (
                <StoryBlocksEditor blocks={article.contentBlocks} onChange={updateBodyBlocks} />
              ) : null}

              {previewMode !== "write" ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-stone-50">
                    {article.heroImage ? (
                      <img src={article.heroImage} alt={article.heroAlt || article.title || "Story preview image"} className="h-52 w-full object-cover" />
                    ) : (
                      <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-zinc-500">
                        Hero image preview appears here when a URL is added.
                      </div>
                    )}

                    <div className="border-t border-zinc-200 bg-white p-5">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{sectionLabel}</p>
                      <h4 className="mt-3 font-news text-4xl leading-tight text-zinc-950">
                        {article.title || "Untitled story"}
                      </h4>
                      <p className="mt-4 text-base leading-8 text-zinc-700">
                        {article.dek || "Your standfirst will appear here once you add it."}
                      </p>
                      <div className="mt-6 flex items-center gap-3 text-sm text-zinc-600">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                          LN
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">London News desk</p>
                          <p>{article.publishedAt ? `Published ${new Date(article.publishedAt).toLocaleString()}` : "Not published yet"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                    {previewBlocks.length ? (
                      <ArticleBody blocks={previewBlocks} />
                    ) : (
                      <div className="rounded-[1.25rem] border border-dashed border-zinc-300 bg-stone-50 p-6 text-sm text-zinc-500">
                        Add story blocks to see the live article rendering preview.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Search and social</p>
                <h3 className="mt-2 font-news text-3xl text-zinc-950">Metadata preview</h3>
              </div>

              <button
                type="button"
                onClick={() => updateSeo("socialImage", article.heroImage)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
              >
                Use hero image for social
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO title</span>
                  <span className={`text-xs ${countTone((article.seo.metaTitle || article.title).length, 60)}`}>
                    {(article.seo.metaTitle || article.title).length}/60
                  </span>
                </div>
                <input
                  value={article.seo.metaTitle}
                  onChange={(event) => updateSeo("metaTitle", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Defaults to the story headline"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Social image URL</span>
                <input
                  value={article.seo.socialImage}
                  onChange={(event) => updateSeo("socialImage", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Defaults to the hero image"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO description</span>
                  <span className={`text-xs ${countTone((article.seo.metaDesc || metaDescFallback).length, 160)}`}>
                    {(article.seo.metaDesc || metaDescFallback).length}/160
                  </span>
                </div>
                <textarea
                  value={article.seo.metaDesc}
                  onChange={(event) => updateSeo("metaDesc", event.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Defaults to the dek or excerpt if left blank."
                />
              </label>
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={article.seo.noindex}
                onChange={(event) => updateSeo("noindex", event.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              />
              Keep this article out of search indexing
            </label>

            <div className="mt-6 grid gap-5 grid-cols-1">
              <div className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Search result preview</p>
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs text-emerald-700">londonnews.local {publicPath}</p>
                  <p className="mt-2 text-lg font-semibold text-[#1a0dab]">{metaTitleFallback}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{metaDescFallback}</p>
                  <p className="mt-3 text-xs text-zinc-500">Canonical: {article.seo.canonical || publicPath}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Social share preview</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  {article.seo.socialImage || article.heroImage ? (
                    <img
                      src={article.seo.socialImage || article.heroImage}
                      alt={article.heroAlt || article.title || "Social preview image"}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-zinc-500">
                      Add a hero or social image to preview the share card.
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-zinc-950">
                      {article.seo.socialTitle || metaTitleFallback}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {article.seo.socialDescription || metaDescFallback}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Canonical URL</span>
                <input
                  value={article.seo.canonical}
                  onChange={(event) => updateSeo("canonical", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder={publicPath}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Social title</span>
                <input
                  value={article.seo.socialTitle}
                  onChange={(event) => updateSeo("socialTitle", event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Defaults to the headline"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Social description</span>
                <textarea
                  value={article.seo.socialDescription}
                  onChange={(event) => updateSeo("socialDescription", event.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Defaults to the SEO description"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Workflow check</p>
            <h3 className="mt-2 font-news text-3xl text-zinc-950">Readiness</h3>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-zinc-600">{readyCount} of {readinessItems.length} recommended items are ready.</p>

            <div className="mt-5 space-y-3">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
                  <span className="text-sm text-zinc-700">{item.label}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${item.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                    {item.ready ? "Ready" : "Needs work"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Publishing</p>
            <h3 className="mt-2 font-news text-3xl text-zinc-950">Desk actions</h3>

            <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Current route</p>
              <p className="mt-2 break-all text-sm font-semibold text-zinc-950">{publicPath}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {article.publishedAt ? `Last published ${new Date(article.publishedAt).toLocaleString()}.` : "This story has not been published yet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-700"
                  >
                    Open preview
                  </a>
                ) : null}
                {article.publishedAt ? (
                  <a
                    href={publicPath}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-700"
                  >
                    Open live article
                  </a>
                ) : null}
              </div>
            </div>

            {canPublish && article.id ? (
              <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Scheduled visibility</p>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      Publish at
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledPublishInput}
                      onChange={(event) => setScheduledPublishInput(event.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      Unpublish at
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledUnpublishInput}
                      onChange={(event) => setScheduledUnpublishInput(event.target.value)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p>
                    {article.scheduledPublishAt
                      ? `Scheduled to publish ${new Date(article.scheduledPublishAt).toLocaleString()}.`
                      : "No publish time is scheduled."}
                  </p>
                  <p>
                    {article.scheduledUnpublishAt
                      ? `Scheduled to unpublish ${new Date(article.scheduledUnpublishAt).toLocaleString()}.`
                      : "No takedown time is scheduled."}
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => saveSchedule()}
                    disabled={busy}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
                  >
                    Save schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSchedule({ clearPublishSchedule: true })}
                    disabled={busy || !article.scheduledPublishAt}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
                  >
                    Clear publish schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSchedule({ clearUnpublishSchedule: true })}
                    disabled={busy || !article.scheduledUnpublishAt}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
                  >
                    Clear unpublish schedule
                  </button>
                </div>
              </div>
            ) : null}

            {!canAttemptSave ? (
              <div className="mt-4 rounded-[1.5rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Add at least a headline and a structured story body before saving.
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={busy || !canAttemptSave}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
              >
                {pendingAction === "draft" ? "Saving..." : "Save draft"}
              </button>

              <button
                type="button"
                onClick={() => save("submit")}
                disabled={busy || !canAttemptSave}
                className="w-full rounded-xl border border-amber-400 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800 disabled:opacity-50"
              >
                {pendingAction === "submit" ? "Sending..." : canReview ? "Approve for desk" : "Submit for review"}
              </button>

              {canPublish ? (
                <>
                  <button
                    type="button"
                    onClick={() => save("publish")}
                    disabled={busy || !canAttemptSave}
                    className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
                  >
                    {pendingAction === "publish" ? "Publishing..." : "Publish now"}
                  </button>

                  <button
                    type="button"
                    onClick={() => save("unpublish")}
                    disabled={busy || !article.publishedAt}
                    className="w-full rounded-xl border border-rose-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700 disabled:opacity-50"
                  >
                    {pendingAction === "unpublish" ? "Removing..." : "Unpublish now"}
                  </button>
                </>
              ) : null}
            </div>
          </section>

          {canReview && article.id ? (
            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Corrections</p>
              <h3 className="mt-2 font-news text-3xl text-zinc-950">Correction notes</h3>

              <label className="mt-5 block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  New correction note
                </span>
                <textarea
                  value={correctionNote}
                  onChange={(event) => setCorrectionNote(event.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Document what changed, what was corrected, and any context readers should retain."
                />
              </label>

              <button
                type="button"
                onClick={addCorrection}
                disabled={busy || correctionNote.trim().length < 12}
                className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
              >
                Add correction note
              </button>

              <div className="mt-5 space-y-3">
                {(article.corrections || []).map((correction) => (
                  <article key={correction.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Correction note
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(correction.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-zinc-900">
                      {correction.createdByName || "Newsroom user"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{correction.note}</p>
                  </article>
                ))}

                {(article.corrections || []).length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-4 text-sm text-zinc-500">
                    No correction notes have been published for this story.
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Revisions</p>
            <h3 className="mt-2 font-news text-3xl text-zinc-950">Recent history</h3>

            <div className="mt-5 space-y-3">
              {(article.revisions || []).slice(0, 6).map((revision) => (
                <article key={revision.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {revision.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(revision.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-900">
                    {revision.createdByName || "Newsroom user"}
                  </p>
                  {revision.note ? (
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{revision.note}</p>
                  ) : null}
                </article>
              ))}

              {(article.revisions || []).length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-4 text-sm text-zinc-500">
                  Revisions will appear here after the first save.
                </div>
              ) : null}
            </div>
          </section>

            {!isNew && article.id && canDelete ? (
            <section className="rounded-[2rem] border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.24em] text-rose-600">Danger zone</p>
              <h3 className="mt-2 font-news text-2xl text-zinc-950">Delete this article</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Permanently remove this story from the desk and the public site. This action cannot be undone.
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
                Delete article
              </button>
            </section>
          ) : null}
        </aside>
      </div>

      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-rose-600">Confirm delete</p>
            <h2 className="mt-2 font-news text-2xl text-zinc-950">Delete this article?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              You are about to permanently delete{" "}
              <span className="font-semibold text-zinc-900">&ldquo;{article.title || "this article"}&rdquo;</span>. This cannot be undone
              and will remove it from the public site if it is live.
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
                onClick={deleteArticle}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete article"}
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
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-950">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{helper}</p>
    </article>
  );
}

function countTone(length: number, recommended: number) {
  if (!length) return "text-zinc-400";
  if (length > recommended) return "text-rose-700";
  if (length > recommended * 0.85) return "text-amber-700";
  return "text-emerald-700";
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60_000);
  return normalized.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}