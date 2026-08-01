import { type FormEvent, useState } from "react";

export function ContactMessageForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Your message could not be sent.");
        return;
      }

      setMessage(data?.message || "Your message has been sent.");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch {
      setError("Your message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          className="w-full border border-black/10 bg-[#f8f4ec] px-4 py-4 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-black focus:outline-none"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Email address"
          className="w-full border border-black/10 bg-[#f8f4ec] px-4 py-4 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-black focus:outline-none"
          required
        />
      </div>
      <input
        value={form.subject}
        onChange={(event) => updateField("subject", event.target.value)}
        placeholder="Subject"
        className="w-full border border-black/10 bg-[#f8f4ec] px-4 py-4 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-black focus:outline-none"
        required
      />
      <textarea
        value={form.message}
        onChange={(event) => updateField("message", event.target.value)}
        placeholder="How can London News help?"
        className="min-h-[180px] w-full border border-black/10 bg-[#f8f4ec] px-4 py-4 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-black focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="bg-[var(--accent)] px-6 py-4 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32] disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send message"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
