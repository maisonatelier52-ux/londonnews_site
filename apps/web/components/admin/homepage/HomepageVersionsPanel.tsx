import { formatDateTime } from "../../../lib/format-date";

type VersionRow = {
  id: string;
  label?: string | null;
  status: string;
  previewUrl: string;
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  snapshot: any;
};

export function HomepageVersionsPanel({
  versions,
  onLoadSnapshot,
  onPublishVersion,
  onScheduleVersion,
  onDeleteVersion,
}: {
  versions: VersionRow[];
  onLoadSnapshot: (snapshot: any) => void;
  onPublishVersion: (versionId: string) => void;
  onScheduleVersion: (versionId: string) => void;
  onDeleteVersion: (versionId: string) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Version history</p>
          <h2 className="mt-2 font-news text-3xl text-zinc-950">Drafts, schedules, and publishes</h2>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((version) => (
          <article key={version.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-zinc-950">
                    {version.label || "Untitled version"}
                  </h3>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    version.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-800"
                      : version.status === "SCHEDULED"
                      ? "bg-amber-100 text-amber-800"
                      : version.status === "DRAFT"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {version.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-zinc-600">
                  <div>Created {formatDateTime(version.createdAt)}</div>
                  <div>Updated {formatDateTime(version.updatedAt)}</div>
                  {version.scheduledFor ? <div>Scheduled {formatDateTime(version.scheduledFor)}</div> : null}
                  {version.publishedAt ? <div>Published {formatDateTime(version.publishedAt)}</div> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onLoadSnapshot(version.snapshot)}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
                >
                  Load draft
                </button>
                <a
                  href={version.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
                >
                  Preview
                </a>
                <button
                  type="button"
                  onClick={() => onScheduleVersion(version.id)}
                  className="rounded-lg border border-amber-500 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onPublishVersion(version.id)}
                  className="rounded-lg bg-zinc-950 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white"
                >
                  Publish now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${version.label || "Untitled version"}"? This cannot be undone.`)) {
                      onDeleteVersion(version.id);
                    }
                  }}
                  className="rounded-lg border border-red-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}

        {versions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-6 text-sm text-zinc-500">
            No drafts saved yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}