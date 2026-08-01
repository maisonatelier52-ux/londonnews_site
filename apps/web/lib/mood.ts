import { shouldUseSecureCookies } from "./security/env";
import type { MoodItem, MoodOption } from "./cms-types";

export const MOOD_VISITOR_COOKIE = "ln_mood_visitor";

const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { key: "happy", label: "Happy" },
  { key: "sad", label: "Sad" },
  { key: "cant-complain", label: "Can't complain" }
];

const DEFAULT_MOOD_BREAKDOWN: MoodItem[] = [
  { key: "happy", label: "Happy", value: "82%" },
  { key: "sad", label: "Sad", value: "6%" },
  { key: "cant-complain", label: "Can't complain", value: "12%" }
];

export function defaultMoodOptions() {
  return DEFAULT_MOOD_OPTIONS.map((item) => ({ ...item }));
}

export function defaultMoodBreakdown() {
  return DEFAULT_MOOD_BREAKDOWN.map((item) => ({ ...item }));
}

export function toMoodOptionKey(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "option"
  );
}

export function normalizeMoodOptions(input: unknown, fallbackBreakdown?: Array<{ label?: string | null }>) {
  const source =
    Array.isArray(input) && input.length > 0
      ? input
      : Array.isArray(fallbackBreakdown) && fallbackBreakdown.length > 0
        ? fallbackBreakdown
        : defaultMoodOptions();

  const seen = new Set<string>();

  return source
    .map((item: any, index) => {
      const label = String(item?.label || `Option ${index + 1}`).trim();
      const baseKey = String(item?.key || toMoodOptionKey(label));
      let key = baseKey || `option-${index + 1}`;

      while (seen.has(key)) {
        key = `${baseKey}-${index + 1}`;
      }

      seen.add(key);
      return { key, label };
    })
    .slice(0, 6);
}

export function normalizeMoodBreakdown(input: unknown, options: MoodOption[]): MoodItem[] {
  const valueByKey = new Map<string, string>();
  const valueByLabel = new Map<string, string>();
  const defaults = defaultMoodBreakdown();

  if (Array.isArray(input)) {
    for (const item of input) {
      const label = String((item as any)?.label || "").trim();
      const value = String((item as any)?.value || "").trim();
      if (!label || !value) continue;
      valueByLabel.set(label, value);
      valueByKey.set(String((item as any)?.key || toMoodOptionKey(label)), value);
    }
  }

  return options.map((option, index) => ({
    key: option.key,
    label: option.label,
    value: valueByKey.get(option.key) || valueByLabel.get(option.label) || defaults[index]?.value || "0%"
  }));
}

export function getMoodSurveyDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatMoodUpdatedText(lastVoteAt: Date | string | null | undefined, fallback: string) {
  if (!lastVoteAt) return fallback;

  const updatedAt = new Date(lastVoteAt);
  if (Number.isNaN(updatedAt.getTime())) return fallback;

  const diffMs = Date.now() - updatedAt.getTime();
  if (diffMs < 60_000) return "Updated just now";

  const diffMinutes = Math.max(Math.round(diffMs / 60_000), 1);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.max(Math.round(diffMinutes / 60), 1);
  if (diffHours < 24) {
    return `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.max(Math.round(diffHours / 24), 1);
  return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function computeMoodBreakdown(
  options: MoodOption[],
  counts: Record<string, number>,
  fallbackBreakdown: MoodItem[]
) {
  const totalVotes = options.reduce((sum, option) => sum + Math.max(counts[option.key] || 0, 0), 0);

  if (totalVotes <= 0) {
    return {
      totalVotes: 0,
      breakdown: normalizeMoodBreakdown(fallbackBreakdown, options)
    };
  }

  const rawShares = options.map((option) => {
    const count = Math.max(counts[option.key] || 0, 0);
    const raw = (count / totalVotes) * 100;
    const whole = Math.floor(raw);
    return {
      option,
      whole,
      fraction: raw - whole
    };
  });

  let remaining = 100 - rawShares.reduce((sum, item) => sum + item.whole, 0);
  rawShares
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((item) => {
      if (remaining <= 0) return;
      item.whole += 1;
      remaining -= 1;
    });

  const percentageByKey = new Map(rawShares.map((item) => [item.option.key, item.whole]));

  return {
    totalVotes,
    breakdown: options.map((option) => ({
      key: option.key,
      label: option.label,
      value: `${percentageByKey.get(option.key) || 0}%`
    }))
  };
}

export function readNamedCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = shouldUseSecureCookies() ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}
