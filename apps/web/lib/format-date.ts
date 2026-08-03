// apps/web/lib/format-date.ts
// `.toLocaleString()` / `.toLocaleDateString()` with no arguments use the
// runtime's default locale. That default differs between the Node server
// (usually en-US) and the browser (whatever the visitor's OS/browser is set
// to, e.g. en-GB). Same Date, two different rendered strings -> React
// hydration mismatch. Always format dates with an explicit locale so the
// server-rendered HTML and the client-rendered HTML are identical.
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

export function formatDateTime(value: string | number | Date) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}