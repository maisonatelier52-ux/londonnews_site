// apps/web/pages/admin/articles/[id].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { ArticleEditor } from "../../../components/admin/ArticleEditor";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { articleEditorInclude, toArticleEditorPayload } from "../../../lib/articles/editor-payload";
import { setNoStore } from "../../../lib/server/api";
import { authOptions } from "../../api/auth/[...nextauth]";
import { canEditArticle } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const id = params?.id as string;
  const [article, sections] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        ...articleEditorInclude
      }
    }),
    prisma.section.findMany({
      where: {
        slug: {
          not: "classifieds"
        }
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
  ]);

  if (!article) return { notFound: true };

  if (
    !canEditArticle({
      role: session.user.role,
      userId: session.user.id,
      authorId: article.authorId,
      status: article.status
    })
  ) {
    return { redirect: { destination: "/admin/articles", permanent: false } };
  }

  return {
    props: {
      role: session.user.role,
      sections: JSON.parse(JSON.stringify(sections)),
      article: JSON.parse(JSON.stringify(toArticleEditorPayload(article))),
      meta: {
        authorName: article.author?.name || "Unknown",
        sectionName: article.section?.name || "Unassigned"
      }
    }
  };
};

export default function ArticleDetailPage({
  role,
  sections,
  article,
  meta
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Article detail</p>
          <h1 className="mt-2 font-news text-5xl text-zinc-950">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{meta.sectionName}</span>
            <span>•</span>
            <span>{meta.authorName}</span>
            <StatusBadge label={article.status} />
          </div>
        </div>
        <Link
          href="/admin/articles"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
        >
          Back to articles
        </Link>
      </div>

      <ArticleEditor initialArticle={article} sections={sections} role={role} />
    </AdminLayout>
  );
}
