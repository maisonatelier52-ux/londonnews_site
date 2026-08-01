// apps/web/pages/admin/articles/index.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { Pagination } from "../../../components/admin/Pagination";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { setNoStore } from "../../../lib/server/api";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../utils/prisma";
import { isAuthorScopedRole } from "../../../utils/auth";

const PAGE_SIZE = 10;

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const status = typeof query.status === "string" ? query.status : "";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const parsedPage = typeof query.page === "string" ? parseInt(query.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const searchWhere = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { excerpt: { contains: q, mode: "insensitive" as const } },
          { dek: { contains: q, mode: "insensitive" as const } },
          { author: { name: { contains: q, mode: "insensitive" as const } } },
          { section: { name: { contains: q, mode: "insensitive" as const } } },
          { seo: { slug: { contains: q, mode: "insensitive" as const } } }
        ]
      }
    : {};

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(isAuthorScopedRole(session.user.role) ? { authorId: session.user.id } : {}),
    ...searchWhere
  };

  try {
    const [articles, totalCount, draftCount, reviewCount, publishedCount] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { author: true, section: true, seo: true },
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE
      }),
      prisma.article.count({ where }),
      prisma.article.count({ where: { ...where, status: "DRAFT" } }),
      prisma.article.count({ where: { ...where, status: "IN_REVIEW" } }),
      prisma.article.count({ where: { ...where, status: "APPROVED" } })
    ]);

    return {
      props: {
        articles: JSON.parse(JSON.stringify(articles)),
        role: session.user.role,
        statusFilter: status,
        q,
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        draftCount,
        reviewCount,
        publishedCount,
        dataUnavailable: false
      }
    };
  } catch {
    return {
      props: {
        articles: [],
        role: session.user.role,
        statusFilter: status,
        q,
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 0,
        draftCount: 0,
        reviewCount: 0,
        publishedCount: 0,
        dataUnavailable: true
      }
    };
  }
};

const FILTERS = ["", "DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export default function ArticlesIndexPage({
  articles,
  statusFilter,
  q,
  page,
  pageSize,
  totalCount,
  draftCount,
  reviewCount,
  publishedCount,
  dataUnavailable
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(q ?? "");

  useEffect(() => {
    setSearchInput(q ?? "");
  }, [q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (q ?? "")) return;

    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (trimmed) params.set("q", trimmed);
      params.set("page", "1");
      router.push(`/admin/articles?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filterHref = (filter: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (q) params.set("q", q);
    return params.toString() ? `/admin/articles?${params.toString()}` : "/admin/articles";
  };

  return (
    <AdminLayout>
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Article desk</p>
            <h1 className="mt-2 font-news text-5xl text-zinc-950">Stories and workflow</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
              Track guest-writer drafts, editorial review, and published stories that flow into the public templates and homepage picker.
            </p>
          </div>

          <Link
            href="/admin/articles/new"
            className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
          >
            New article
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link
              key={filter || "ALL"}
              href={filterHref(filter)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                statusFilter === filter || (!statusFilter && !filter)
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-300 text-zinc-700"
              }`}
            >
              {filter || "All"}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Visible stories</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{totalCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Drafts</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{draftCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">In review</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{reviewCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{publishedCount}</p>
          </article>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Quick search</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
              placeholder="Search headlines, slugs, authors, or sections"
            />
          </label>
        </div>

        {dataUnavailable ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Editorial records are currently unavailable. Confirm the configured Postgres service is reachable.
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                <th className="px-4 py-3">Headline</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {articles.map((article: any) => (
                <tr key={article.id} className="transition hover:bg-stone-50">
                  <td className="px-4 py-4">
                    <Link href={`/admin/articles/${article.id}`} className="font-semibold text-zinc-950">
                      {article.title}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">/{article.seo?.slug || article.id}</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
                      {article.excerpt || article.dek || "No summary added yet."}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-zinc-700">{article.section?.name || "Unassigned"}</td>
                  <td className="px-4 py-4 text-zinc-700">{article.author?.name || "Unknown"}</td>
                  <td className="px-4 py-4"><StatusBadge label={article.status} /></td>
                  <td className="px-4 py-4 text-xs leading-6 text-zinc-500">
                    {article.publishedAt ? <div>Live since {new Date(article.publishedAt).toLocaleString()}</div> : <div>Not live</div>}
                    {article.scheduledPublishAt ? <div>Publish {new Date(article.scheduledPublishAt).toLocaleString()}</div> : null}
                    {article.scheduledUnpublishAt ? <div>Unpublish {new Date(article.scheduledUnpublishAt).toLocaleString()}</div> : null}
                  </td>
                  <td className="px-4 py-4 text-zinc-500">
                    {new Date(article.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-8 text-center text-sm text-zinc-500">
            {q ? "No stories match that search yet." : "No stories match this filter yet."}
          </div>
        ) : (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            basePath="/admin/articles"
            status={statusFilter}
            q={q}
            itemLabel="stories"
          />
        )}
      </section>
    </AdminLayout>
  );
}
