import { type FormEvent, useState } from "react";

export function ClassifiedEnquiryForm({ slug, title }: { slug: string; title: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `I'm interested in "${title}". Please contact me with the next steps.`
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
      const response = await fetch(`/api/public/classifieds/${slug}/enquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Your enquiry could not be sent.");
        return;
      }

      setMessage(data?.message || "Your enquiry has been sent.");

      setForm({
        name: "",
        email: "",
        phone: "",
        message: `I'm interested in "${title}". Please contact me with the next steps.`
      });
    } catch {
      setError("Your enquiry could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-white/14 bg-white/6 px-3 py-3 text-sm text-black placeholder:text-black/40 outline-none transition focus:border-white/28";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4">
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          className={inputClassName}
          placeholder="Your name"
          required
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className={inputClassName}
          placeholder="Email address"
          required
        />

        <input
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          className={inputClassName}
          placeholder="Phone number (optional)"
        />

        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className={`${inputClassName} min-h-[150px]`}
          placeholder="Your enquiry"
          required
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32] disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send enquiry"}
      </button>

      {message ? (
        <p className="text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}