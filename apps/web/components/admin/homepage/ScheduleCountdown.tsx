import { useEffect, useState } from "react";
import { formatDateTime } from "../../../lib/format-date";

function getRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  return diff > 0 ? diff : 0;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Going live any moment";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

// Live "goes live in ..." countdown. Ticks client-side every second;
// server-rendered pass shows the static date only, to avoid hydration mismatch.
export function ScheduleCountdown({
  scheduledFor,
  className,
}: {
  scheduledFor: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(getRemaining(scheduledFor));
    const interval = setInterval(() => {
      setRemaining(getRemaining(scheduledFor));
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledFor]);

  const live = remaining !== null && remaining <= 0;

  return (
    <span
      className={
        className ||
        `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
          live ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`
      }
    >
      {remaining === null
        ? `Scheduled ${formatDateTime(scheduledFor)}`
        : live
        ? "Publishing now"
        : `Live in ${formatRemaining(remaining)}`}
    </span>
  );
}