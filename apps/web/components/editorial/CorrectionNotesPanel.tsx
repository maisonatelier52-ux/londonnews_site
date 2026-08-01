import type { ArticleCorrectionView } from "../../lib/cms-types";

export function CorrectionNotesPanel({ notes }: { notes: ArticleCorrectionView[] }) {
  if (!notes.length) return null;

  return (
    <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-amber-900">Corrections and updates</p>
          <h2 className="mt-2 font-news text-3xl text-zinc-950">Article notes</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900">
          {notes.length}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {notes.map((note) => (
          <article key={note.id} className="rounded-[1.5rem] border border-amber-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <span>Correction note</span>
              <span>{new Date(note.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-700">{note.note}</p>
            {note.createdByName ? (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Added by {note.createdByName}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
