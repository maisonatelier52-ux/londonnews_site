import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Container } from "../../components/home/Container";
import { PublicPageShell } from "../../components/public/PublicPageShell";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import { CLASSIFIED_CATEGORY_OPTIONS } from "../../lib/classifieds-data";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import { buildCollectionPageStructuredData, buildSeo } from "../../lib/seo";

export const getStaticProps: GetStaticProps = async () => {
  const homepage = await getActiveHomepageData();

  if (!homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(JSON.stringify({ homepage })),
    revalidate: 60
  };
};

export default function SubmitClassifiedPage({
  homepage
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [form, setForm] = useState({
    category: "",
    title: "",
    price: "",
    location: "",
    summary: "",
    description: "",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    image: "",
    expiresAt: ""
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const seo = buildSeo({
    title: "Submit a Classified | London News",
    description: "Submit a listing to the London News classifieds desk for review and publication.",
    canonical: absoluteUrl("/classifieds/submit"),
    noindex: true
  });

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/public/classifieds/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "We could not submit your listing.");
        return;
      }

      setMessage("Your listing has been sent to the London News classifieds desk for review.");
      setForm({
        category: "",
        title: "",
        price: "",
        location: "",
        summary: "",
        description: "",
        sellerName: "",
        sellerEmail: "",
        sellerPhone: "",
        image: "",
        expiresAt: ""
      });
    } catch {
      setError("The submission request failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="classifieds-submit-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: "Submit a Classified",
          description: seo.description,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: "Classifieds", item: absoluteUrl("/classifieds") },
            { name: "Submit", item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow="Public submissions"
        title="Submit a classified"
        description="Send a listing to the London News classifieds desk. Editors review every submission before anything appears on the public site."
        actions={
          <>
            <Link
              href="/classifieds"
              className="border border-black/10 bg-white/55 px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#243144] transition hover:border-black hover:text-black"
            >
              Browse classifieds
            </Link>
            <Link
              href="/login"
              className="border border-black/10 bg-white/55 px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#243144] transition hover:border-black hover:text-black"
            >
              Newsroom login
            </Link>
          </>
        }
      >
        <Container className="space-y-10 lg:space-y-12">
          {message ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 shadow-[0_16px_50px_rgba(11,16,32,0.05)]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900 shadow-[0_16px_50px_rgba(11,16,32,0.05)]">
              {error}
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <form
              onSubmit={submitForm}
              className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm"
            >
              <div className="h-[2px] w-16 bg-[var(--accent)]" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                  >
                    <option value="">Choose a category</option>
                    {CLASSIFIED_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Price</span>
                  <input
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="GBP 495"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="Write the listing title"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Location</span>
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="Canary Wharf"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Summary</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) => setForm({ ...form, summary: event.target.value })}
                    className="min-h-[110px] w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="A short summary readers will see first."
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className="min-h-[220px] w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="Describe the item or service in detail. Separate paragraphs with blank lines."
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Seller name</span>
                  <input
                    value={form.sellerName}
                    onChange={(event) => setForm({ ...form, sellerName: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Seller email</span>
                  <input
                    value={form.sellerEmail}
                    onChange={(event) => setForm({ ...form, sellerEmail: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Phone</span>
                  <input
                    value={form.sellerPhone}
                    onChange={(event) => setForm({ ...form, sellerPhone: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Expiry date</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Image URL</span>
                  <input
                    value={form.image}
                    onChange={(event) => setForm({ ...form, image: event.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-[#f8f4ec] px-3 py-3 text-sm text-[#1a2433] outline-none transition focus:border-black/30"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-6 bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32] disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit listing"}
              </button>
            </form>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/16 bg-[linear-gradient(180deg,rgba(11,16,32,0.92)_0%,rgba(11,16,32,0.98)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(11,16,32,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">How it works</p>
                <ol className="mt-4 space-y-3 text-sm leading-8 text-white/74">
                  <li>Fill in the listing details and contact information.</li>
                  <li>The classifieds desk reviews the submission for clarity and suitability.</li>
                  <li>Approved listings appear on the public classifieds section and can be featured by editors.</li>
                </ol>
              </section>

              <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">Editorial note</p>
                <p className="mt-4 text-sm leading-8 text-[#56606d]">
                  Listings enter the moderated classifieds workflow before publication. London News can later layer on payments, attachments, or richer seller verification without replacing the core submission path.
                </p>
              </section>
            </aside>
          </section>
        </Container>
      </PublicPageShell>
    </>
  );
}
