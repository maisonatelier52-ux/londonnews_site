// apps/web/components/admin/homepage/StatusBadge.tsx
import { statusTone } from "../../utils/auth";

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusTone(label)}`}>
      {label.replace("_", " ")}
    </span>
  );
}
