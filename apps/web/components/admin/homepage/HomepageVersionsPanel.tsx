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
}: {
  versions: VersionRow[];
  onLoadSnapshot: (snapshot: any) => void;
  onPublishVersion: (versionId: string) => void;
  onScheduleVersion: (versionId: string) => void;
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
                  <div>Created {new Date(version.createdAt).toLocaleString()}</div>
                  <div>Updated {new Date(version.updatedAt).toLocaleString()}</div>
                  {version.scheduledFor ? <div>Scheduled {new Date(version.scheduledFor).toLocaleString()}</div> : null}
                  {version.publishedAt ? <div>Published {new Date(version.publishedAt).toLocaleString()}</div> : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onLoadSnapshot(version.snapshot)}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
                >
                  Load draft
                </button>
                <a
                  href={version.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
                >
                  Preview
                </a>
                <button
                  type="button"
                  onClick={() => onScheduleVersion(version.id)}
                  className="rounded-xl border border-amber-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onPublishVersion(version.id)}
                  className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Publish now
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
