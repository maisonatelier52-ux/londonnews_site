import { useEffect, useState } from "react";
import {
  AdminHomepage,
  SECTION_PRESETS,
  createDefaultSectionPreset,
  normalizeSections,
  prettyJson,
  safeJsonParse,
} from "../../../lib/admin/homepage-utils";
import { HomepageWorkflowBar } from "./HomepageWorkflowBar";
import { HomepageVersionsPanel } from "./HomepageVersionsPanel";
import { SectionEditor } from "./SectionEditor";
import { MediaUploadField } from "../MediaUploadField";
import { formatDateTime } from "../../../lib/format-date";

export function HomepageWorkflowEditor({
  initialHomepage,
  initialVersions,
}: {
  initialHomepage: AdminHomepage;
  initialVersions: any[];
}) {
  const [homepage, setHomepage] = useState<AdminHomepage>(initialHomepage);
  const [versions, setVersions] = useState<any[]>(initialVersions || []);
  const [settingsText, setSettingsText] = useState(prettyJson(initialHomepage.settings));
  const [newPresetKey, setNewPresetKey] = useState<string>(SECTION_PRESETS[0].key);
  const [draftLabel, setDraftLabel] = useState("Draft");
  const [scheduledFor, setScheduledFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // Set the timestamped default only after mount. Computing `new Date()` during
  // the initial render would run once on the server and again on the client at a
  // different instant (and possibly a different default locale), causing a
  // hydration mismatch.
  useEffect(() => {
    setDraftLabel(`Draft ${formatDateTime(new Date())}`);
  }, []);

  function buildPayload() {
    return {
      ...homepage,
      settings: safeJsonParse(settingsText, {}),
      sections: normalizeSections(homepage.sections),
    };
  }

  function updateSection(index: number, nextSection: any) {
    const next = [...homepage.sections];
    next[index] = nextSection;
    setHomepage({ ...homepage, sections: next });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= homepage.sections.length) return;
    const next = [...homepage.sections];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setHomepage({ ...homepage, sections: next });
  }

  function removeSection(index: number) {
    setHomepage({ ...homepage, sections: homepage.sections.filter((_, i) => i !== index) });
  }

  function addSection() {
    setHomepage({
      ...homepage,
      sections: [
        ...homepage.sections,
        createDefaultSectionPreset(newPresetKey, homepage.sections.length + 1),
      ],
    });
  }

  async function refreshVersions() {
    const res = await fetch(`/api/admin/homepages/${homepage.id}/versions`);
    const data = await res.json();
    if (res.ok) setVersions(data);
  }

  async function saveDraft() {
    setBusy(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/admin/homepages/${homepage.id}/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: draftLabel,
        payload: buildPayload(),
      }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to save draft.");
      return;
    }

    setPreviewUrl(data.previewUrl);
    setMessage("Draft saved.");
    await refreshVersions();
  }

  async function publishNow(versionId?: string) {
    setBusy(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/admin/homepages/${homepage.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        versionId
          ? { versionId, activate: true }
          : { label: draftLabel, payload: buildPayload(), activate: true }
      ),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to publish homepage.");
      return;
    }

    setPreviewUrl(data?.version?.previewUrl || previewUrl);
    setHomepage({ ...homepage, isActive: true });
    setMessage("Homepage published and activated.");
    await refreshVersions();
  }

  async function schedule(versionId?: string) {
    if (!scheduledFor) {
      setError("Choose a publish date/time first.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    const res = await fetch(`/api/admin/homepages/${homepage.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        versionId
          ? { versionId, scheduledFor }
          : { label: draftLabel, payload: buildPayload(), scheduledFor }
      ),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Failed to schedule homepage.");
      return;
    }

    setPreviewUrl(data.previewUrl || previewUrl);
    setMessage("Homepage scheduled.");
    await refreshVersions();
  }

  function loadSnapshot(snapshot: any) {
    setHomepage({
      ...homepage,
      title: snapshot.title,
      slug: snapshot.slug,
      seoTitle: snapshot.seoTitle || "",
      seoDescription: snapshot.seoDescription || "",
      seoImage: snapshot.seoImage || "",
      settings: snapshot.settings || {},
      sections: snapshot.sections || [],
    });
    setSettingsText(prettyJson(snapshot.settings || {}));
    setMessage("Loaded version into editor.");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Homepage title</span>
            <input
              value={homepage.title}
              onChange={(e) => setHomepage({ ...homepage, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Slug</span>
            <input
              value={homepage.slug}
              onChange={(e) => setHomepage({ ...homepage, slug: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO title</span>
            <input
              value={homepage.seoTitle || ""}
              onChange={(e) => setHomepage({ ...homepage, seoTitle: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="block">
            <MediaUploadField
              label="SEO image URL"
              value={homepage.seoImage || ""}
              onChange={(value) => setHomepage({ ...homepage, seoImage: value })}
              folder="homepage"
              helperText="Upload the social/SEO image for this homepage version."
            />
          </div>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">SEO description</span>
            <textarea
              value={homepage.seoDescription || ""}
              onChange={(e) => setHomepage({ ...homepage, seoDescription: e.target.value })}
              className="min-h-[84px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>

      <HomepageWorkflowBar
        onSaveDraft={saveDraft}
        onPublishNow={() => publishNow()}
        onSchedule={() => schedule()}
        draftLabel={draftLabel}
        setDraftLabel={setDraftLabel}
        scheduledFor={scheduledFor}
        setScheduledFor={setScheduledFor}
        busy={busy}
        previewUrl={previewUrl}
        active={homepage.isActive}
      />

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-news text-3xl text-zinc-950">Homepage settings JSON</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              This powers masthead copy, nav labels, forecast tabs, live mood-survey labels, survey text, events, and classifieds.
            </p>
          </div>
        </div>

        <textarea
          value={settingsText}
          onChange={(e) => setSettingsText(e.target.value)}
          className="mt-5 min-h-[300px] w-full rounded-[1.5rem] border border-zinc-300 bg-stone-50 p-4 font-mono text-sm leading-6"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-news text-4xl text-zinc-950">Sections</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Build the homepage with reusable editorial blocks and article slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={newPresetKey}
              onChange={(e) => setNewPresetKey(e.target.value)}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            >
              {SECTION_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSection}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
            >
              Add section
            </button>
          </div>
        </div>

        {homepage.sections.map((section, index) => (
          <SectionEditor
            key={`${section.key}-${index}`}
            section={section}
            index={index}
            total={homepage.sections.length}
            onChange={(next) => updateSection(index, next)}
            onRemove={() => removeSection(index)}
            onMoveUp={() => moveSection(index, -1)}
            onMoveDown={() => moveSection(index, 1)}
          />
        ))}
      </section>

      <HomepageVersionsPanel
        versions={versions}
        onLoadSnapshot={loadSnapshot}
        onPublishVersion={(versionId) => publishNow(versionId)}
        onScheduleVersion={(versionId) => schedule(versionId)}
      />
    </div>
  );
}