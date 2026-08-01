import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { authOptions } from "../../api/auth/[...nextauth]";
import { setNoStore } from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";
import { canDeleteHomepage, canManageHomepage, hydrateHomepage } from "../../../lib/admin/homepage-utils";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  setNoStore(ctx.res);
  const session = await getServerSession(ctx.req, ctx.res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const role = currentUser.role;
  if (!canManageHomepage(role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const homepages = await prisma.homepage.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { sections: true } } },
  }).catch(() => []);

  return {
    props: {
      homepages: JSON.parse(JSON.stringify(homepages.map((homepage) => hydrateHomepage(homepage) || homepage))),
      role,
    },
  };
};

export default function HomepageIndexPage({
  homepages,
  role,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [title, setTitle] = useState("Homepage");
  const [busy, setBusy] = useState(false);
  const canDelete = canDeleteHomepage(role);

  async function createHomepage() {
    setBusy(true);
    const res = await fetch("/api/admin/homepages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);

    if (res.ok && data?.id) {
      router.push(`/admin/homepage/${data.id}`);
    }
  }

  async function activateHomepage(id: string) {
    await fetch(`/api/admin/homepages/${id}/activate`, { method: "POST" });
    router.replace(router.asPath);
  }

  async function deleteHomepage(id: string) {
    if (!confirm("Delete this homepage? This cannot be undone.")) return;
    await fetch(`/api/admin/homepages/${id}`, { method: "DELETE" });
    router.replace(router.asPath);
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Homepage management</p>
              <h1 className="mt-3 font-news text-5xl text-zinc-950">Front page control</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
                Create alternate homepages, edit slotting, and activate the live front page used by the public website.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="New homepage title"
              />
              <button
                type="button"
                onClick={createHomepage}
                disabled={busy}
                className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create homepage"}
              </button>
            </div>
          </div>
        </section>

        {homepages.length === 0 ? (
          <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            Homepage records are not available yet. Confirm Postgres is running, then rerun <code>npm run db:setup</code>.
          </section>
        ) : null}

        <section className="grid gap-4">
          {homepages.map((homepage: any) => (
            <article key={homepage.id} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-news text-3xl text-zinc-950">{homepage.title}</h2>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${homepage.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
                      {homepage.isActive ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">/{homepage.slug}</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-700">
                    {homepage._count.sections} sections • Updated {new Date(homepage.updatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/homepage/${homepage.id}`}
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
                  >
                    Edit
                  </Link>

                  {!homepage.isActive ? (
                    <button
                      type="button"
                      onClick={() => activateHomepage(homepage.id)}
                      className="rounded-xl border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700"
                    >
                      Activate
                    </button>
                  ) : null}

                  {canDelete && !homepage.isActive ? (
                    <button
                      type="button"
                      onClick={() => deleteHomepage(homepage.id)}
                      className="rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-700"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          {homepages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
              No homepages found yet.
            </div>
          ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}
