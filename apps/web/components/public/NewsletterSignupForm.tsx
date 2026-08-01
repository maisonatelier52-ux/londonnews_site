import { type FormEvent, useState } from "react";

export function NewsletterSignupForm({
  source,
  buttonLabel = "Subscribe",
  dark = false
}: {
  source: string;
  buttonLabel?: string;
  dark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source
        })
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Subscription could not be completed.");
        return;
      }

      setMessage(data?.message || "You are now subscribed.");
      setEmail("");
    } catch {
      setError("Subscription could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const inputClassName = dark
    ? "w-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/38 focus:border-[var(--accent)] focus:outline-none"
    : "border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/36 focus:border-[var(--accent)] focus:outline-none";
  const messageClassName = dark ? "text-white/76" : "text-white/82";
  const errorClassName = dark ? "text-rose-200" : "text-rose-100";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className={inputClassName}
        required
      />
      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="w-full bg-[var(--accent)] px-4 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32] disabled:opacity-60"
      >
        {busy ? "Submitting..." : buttonLabel}
      </button>
      {message ? <p className={`text-sm ${messageClassName}`}>{message}</p> : null}
      {error ? <p className={`text-sm ${errorClassName}`}>{error}</p> : null}
    </form>
  );
}
