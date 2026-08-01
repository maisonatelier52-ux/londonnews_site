import { useMemo, useState } from "react";
import {
  AdminHomepage,
  SECTION_PRESETS,
  createDefaultSectionPreset,
  normalizeSections,
  prettyJson,
  safeJsonParse,
} from "../../../lib/admin/homepage-utils";
import { SectionEditor } from "./SectionEditor";
import { MediaUploadField } from "../MediaUploadField";

export function HomepageEditor({
  initialHomepage,
}: {
  initialHomepage: AdminHomepage;
}) {
  const [homepage, setHomepage] = useState<AdminHomepage>(initialHomepage);
  const [settingsText, setSettingsText] = useState(prettyJson(initialHomepage.settings));
  const [newPresetKey, setNewPresetKey] = useState<string>(SECTION_PRESETS[0].key);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setHomepage({
      ...homepage,
      sections: homepage.sections.filter((_, i) => i !== index),
    });
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

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");

    let parsedSettings: any = {};
    try {
      parsedSettings = JSON.parse(settingsText);
    } catch {
      setSaving(false);
      setError("Homepage settings JSON is invalid.");
      return;
    }

    const payload = {
      ...homepage,
      settings: parsedSettings,
      sections: normalizeSections(homepage.sections),
    };

    const res = await fetch(`/api/admin/homepages/${homepage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error || "Failed to save homepage.");
      return;
    }

    setHomepage(data);
    setSettingsText(prettyJson(data.settings));
    setMessage("Homepage saved.");
  }

  async function activate() {
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/homepages/${homepage.id}/activate`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error || "Failed to activate homepage.");
      return;
    }

    setHomepage({ ...homepage, isActive: true });
    setMessage("Homepage activated.");
  }

  const keyWarning = useMemo(() => {
    const keys = homepage.sections.map((section) => section.key);
    const required = ["leadStory", "supportingStories", "secondFeature", "tertiaryStories", "topHeadlines"];
    const missing = required.filter((key) => !keys.includes(key));
    return missing;
  }, [homepage.sections]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
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
                helperText="Upload the social/SEO image for the live homepage card."
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

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${homepage.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
              {homepage.isActive ? "Live homepage" : "Draft"}
            </span>
            <button
              type="button"
              onClick={activate}
              className="rounded-xl border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save homepage"}
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {keyWarning.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Missing expected front-end section keys: <strong>{keyWarning.join(", ")}</strong>
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-news text-3xl text-zinc-950">Homepage settings JSON</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-700">
              This powers masthead text, nav labels, weather tabs, live mood-survey labels, survey copy, event items, classifieds, and other front-end service modules.
            </p>
          </div>
        </div>

        <textarea
          value={settingsText}
          onChange={(e) => setSettingsText(e.target.value)}
          className="mt-5 min-h-[320px] w-full rounded-[1.5rem] border border-zinc-300 bg-stone-50 p-4 font-mono text-sm leading-6"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-news text-4xl text-zinc-950">Homepage sections</h2>
            <p className="mt-2 text-sm text-zinc-700">Reorder and populate the front-page modules editors want to publish.</p>
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
    </div>
  );
}
