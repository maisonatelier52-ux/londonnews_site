import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { ArticleEditor } from "../../../components/admin/ArticleEditor";
import { authOptions } from "../../api/auth/[...nextauth]";
import type { BodyBlock } from "../../../lib/cms-types";
import { setNoStore } from "../../../lib/server/api";
import { canCreateArticles } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canCreateArticles(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const sections = await prisma.section.findMany({
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
  }).catch(() => []);

  return {
    props: {
      role: session.user.role,
      sections: JSON.parse(JSON.stringify(sections))
    }
  };
};

export default function NewArticlePage({
  role,
  sections
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Article desk</p>
          <h1 className="mt-2 font-news text-5xl text-zinc-950">New story</h1>
        </div>
        <Link
          href="/admin/articles"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
        >
          Back to articles
        </Link>
      </div>

      <ArticleEditor
        isNew
        role={role}
        sections={sections}
        initialArticle={{
          title: "",
          sectionId: sections[0]?.id || "",
          dek: "",
          excerpt: "",
          heroImage: "",
          heroAlt: "",
          content: "",
          contentBlocks: [] as BodyBlock[],
          status: "DRAFT",
          publishedAt: null,
          scheduledPublishAt: null,
          scheduledUnpublishAt: null,
          previewToken: "",
          previewUrl: "",
          seo: {
            slug: "",
            metaTitle: "",
            metaDesc: "",
            canonical: "",
            socialTitle: "",
            socialDescription: "",
            socialImage: "",
            noindex: false
          },
          revisions: [],
          corrections: []
        }}
      />
    </AdminLayout>
  );
}
