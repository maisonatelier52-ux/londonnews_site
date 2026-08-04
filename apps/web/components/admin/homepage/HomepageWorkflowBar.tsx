export function HomepageWorkflowBar({
  onSaveDraft,
  onPublishNow,
  onSchedule,
  draftLabel,
  setDraftLabel,
  scheduledFor,
  setScheduledFor,
  busy,
  previewUrl,
  active,
}: {
  onSaveDraft: () => void;
  onPublishNow: () => void;
  onSchedule: () => void;
  draftLabel: string;
  setDraftLabel: (value: string) => void;
  scheduledFor: string;
  setScheduledFor: (value: string) => void;
  busy?: boolean;
  previewUrl?: string;
  active?: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_260px_220px]">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Draft label</span>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Morning homepage draft"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Schedule publish</span>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-3 pt-5">
            <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
              {active ? "Currently live homepage" : "Draft homepage"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
            >
              Open preview
            </a>
          ) : null}

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={busy}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
          >
            Save draft
          </button>

          <button
            type="button"
            onClick={onSchedule}
            disabled={busy}
            className="rounded-xl border border-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 disabled:opacity-50"
          >
            Schedule
          </button>

          <button
            type="button"
            onClick={onPublishNow}
            disabled={busy}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
          >
            Publish now
          </button>
        </div>
      </div>
    </section>
  );
}
// export function HomepageWorkflowBar({
//   onSaveDraft,
//   onPublishNow,
//   onSchedule,
//   draftLabel,
//   setDraftLabel,
//   scheduledFor,
//   setScheduledFor,
//   busy,
//   previewUrl,
//   active,
// }: {
//   onSaveDraft: () => void;
//   onPublishNow: () => void;
//   onSchedule: () => void;
//   draftLabel: string;
//   setDraftLabel: (value: string) => void;
//   scheduledFor: string;
//   setScheduledFor: (value: string) => void;
//   busy?: boolean;
//   previewUrl?: string;
//   active?: boolean;
// }) {
//   return (
//     <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
//       <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
//         <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_260px_220px]">
//           <label className="block">
//             <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Draft label</span>
//             <input
//               value={draftLabel}
//               onChange={(e) => setDraftLabel(e.target.value)}
//               className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//               placeholder="Morning homepage draft"
//             />
//           </label>

//           <label className="block">
//             <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Schedule publish</span>
//             <input
//               type="datetime-local"
//               value={scheduledFor}
//               onChange={(e) => setScheduledFor(e.target.value)}
//               className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
//             />
//           </label>

//           <div className="flex items-center gap-3 pt-5">
//             <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
//               {active ? "Currently live homepage" : "Draft homepage"}
//             </span>
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {previewUrl ? (
//             <a
//               href={previewUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
//             >
//               Open preview
//             </a>
//           ) : null}

//           <button
//             type="button"
//             onClick={onSaveDraft}
//             disabled={busy}
//             className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700 disabled:opacity-50"
//           >
//             Save draft
//           </button>

//           <button
//             type="button"
//             onClick={onSchedule}
//             disabled={busy}
//             className="rounded-xl border border-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 disabled:opacity-50"
//           >
//             Schedule
//           </button>

//           <button
//             type="button"
//             onClick={onPublishNow}
//             disabled={busy}
//             className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
//           >
//             Publish now
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }
