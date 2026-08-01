// apps/web/pages/admin/index.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { CheckCircle2, FileText, Radio, Tag, User, Users } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { StatCard } from "../../components/admin/StatCard";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { setNoStore } from "../../lib/server/api";
import { authOptions } from "../api/auth/[...nextauth]";
import { roleLabel } from "../../utils/auth";
import { prisma } from "../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const [
      articleCount,
      pendingCount,
      publishedCount,
      userCount,
      subscriberCount,
      contactCount,
      enquiryCount,
      classifiedCount,
      classifiedPendingCount,
      homepages,
      recentArticles
    ] =
      await Promise.all([
        prisma.article.count(),
        prisma.article.count({ where: { status: "IN_REVIEW" } }),
        prisma.article.count({ where: { status: "APPROVED", publishedAt: { not: null } } }),
        prisma.user.count(),
        prisma.newsletterSubscriber.count(),
        prisma.contactMessage.count({ where: { status: "NEW" } }),
        prisma.classifiedEnquiry.count({ where: { status: "NEW" } }),
        prisma.classifiedListing.count(),
        prisma.classifiedListing.count({ where: { status: "IN_REVIEW" } }),
        prisma.homepage.findMany({
          orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
          take: 2
        }),
        prisma.article.findMany({
          include: { section: true, author: true, seo: true },
          orderBy: { updatedAt: "desc" },
          take: 5
        })
      ]);

    return {
      props: {
        role: session.user.role,
        counts: {
          articleCount,
          pendingCount,
          publishedCount,
          userCount,
          subscriberCount,
          contactCount,
          enquiryCount,
          classifiedCount,
          classifiedPendingCount
        },
        homepages: JSON.parse(JSON.stringify(homepages)),
        recentArticles: JSON.parse(JSON.stringify(recentArticles)),
        dataUnavailable: false
      }
    };
  } catch {
    return {
      props: {
        role: session.user.role,
        counts: {
          articleCount: 0,
          pendingCount: 0,
          publishedCount: 0,
          userCount: 0,
          subscriberCount: 0,
          contactCount: 0,
          enquiryCount: 0,
          classifiedCount: 0,
          classifiedPendingCount: 0
        },
        homepages: [],
        recentArticles: [],
        dataUnavailable: true
      }
    };
  }
};

export default function AdminDashboardPage({
  role,
  counts,
  homepages,
  recentArticles,
  dataUnavailable
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Newsroom overview</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-news text-5xl text-zinc-950">Editorial dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
              Signed in as {roleLabel(role)}. This view brings together article workflow, homepage desk operations, audience intake, and public-site publishing status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles/new"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
            >
              New article
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
            >
              Categories
            </Link>
            <Link
              href="/admin/classifieds"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
            >
              Classifieds
            </Link>
            <Link
              href="/admin/audience"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
            >
              Audience
            </Link>
            <Link
              href="/admin/homepage"
              className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white"
            >
              Homepage desk
            </Link>
          </div>
        </div>

        {dataUnavailable ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Database data is currently unavailable. Confirm the configured Postgres service is reachable.
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          eyebrow="Publishing"
          value={counts.articleCount}
          title="Stories tracked"
          description="Draft, review, and approved article records available to the desk."
          icon={FileText}
          iconClassName="bg-violet-100 text-violet-600"
        />
        <StatCard
          eyebrow="Review queue"
          value={counts.pendingCount}
          title="Pending review"
          description="Guest-writer and journalist submissions waiting for an editor."
          icon={User}
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard
          eyebrow="Live coverage"
          value={counts.publishedCount}
          title="Published pieces"
          description="Stories already flowing to the public homepage and section pages."
          icon={Radio}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          eyebrow="Access"
          value={counts.userCount}
          title="Newsroom users"
          description="Accounts with access to editorial, publishing, taxonomy, and admin controls."
          icon={Users}
          iconClassName="bg-sky-100 text-sky-600"
        />
        <StatCard
          eyebrow="Marketplace"
          value={counts.classifiedCount}
          title="Classified listings"
          description={`${counts.classifiedPendingCount} currently waiting on review or approval.`}
          icon={Tag}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatCard
          eyebrow="Audience"
          value={counts.subscriberCount}
          title="Subscribers"
          description={`${counts.contactCount} new contact messages and ${counts.enquiryCount} new classified enquiries.`}
          icon={User}
          iconClassName="bg-rose-100 text-rose-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Recent activity</p>
              <h2 className="mt-2 font-news text-3xl text-zinc-950">Article desk</h2>
            </div>
            <Link href="/admin/articles" className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentArticles.map((article: any) => (
              <article key={article.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      {article.section?.name || "News"} • {article.author?.name || "London News"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-zinc-950">{article.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600">/{article.seo?.slug || article.id}</p>
                  </div>
                  <StatusBadge label={article.status} />
                </div>
              </article>
            ))}

            {recentArticles.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-8 text-center text-sm text-zinc-500">
                No recent articles are available yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Homepage state</p>
            <h2 className="mt-2 font-news text-3xl text-zinc-950">Front page configurations</h2>
            <div className="mt-4 space-y-3">
              {homepages.map((homepage: any) => (
                <div key={homepage.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-zinc-950">{homepage.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">/{homepage.slug}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${homepage.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
                      {homepage.isActive ? "Live" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Handoff checklist</p>
            <h2 className="mt-2 font-news text-3xl text-zinc-950">Developer-ready pieces</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-700">
              {[
                "Public homepage, article template, and category template wired to Prisma query helpers.",
                "Editorial category taxonomy with admin controls, top-nav visibility, and a public sections index.",
                "Classifieds submission, moderated enquiry capture, and public listing pages are live.",
                "Role-aware login, newsroom admin shell, and audience inbox surfaces are in place.",
                "Homepage draft, preview, publish, and schedule workflow is wired to the cron job path.",
                "Single PostgreSQL schema and migration history power local, preview, and production."
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </AdminLayout>
  );
}
