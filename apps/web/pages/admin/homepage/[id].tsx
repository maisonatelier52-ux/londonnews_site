import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { HomepageWorkflowEditor } from "../../../components/admin/homepage/HomepageWorkflowEditor";
import { authOptions } from "../../api/auth/[...nextauth]";
import { setNoStore } from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";
import { canManageHomepage, hydrateHomepage, hydrateHomepageVersion } from "../../../lib/admin/homepage-utils";
import { buildHomepagePreviewUrl } from "../../../lib/admin/homepage-workflow";

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

  const id = ctx.params?.id as string;
  const [homepage, versions] = (await Promise.all([
    prisma.homepage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            slots: {
              orderBy: { position: "asc" },
              include: {
                article: {
                  include: {
                    section: true,
                    seo: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.homepageVersion.findMany({
      where: { homepageId: id },
      orderBy: { updatedAt: "desc" },
    }),
  ]).catch(() => [null, []])) as [any, any[]];

  if (!homepage) return { notFound: true };

  return {
    props: {
      homepage: JSON.parse(JSON.stringify(homepage)),
      versions: JSON.parse(
        JSON.stringify(
          versions.map((version) => ({
            ...hydrateHomepageVersion(version),
            previewUrl: buildHomepagePreviewUrl(version.previewToken),
          }))
        )
      ),
    },
  };
};

export default function HomepageWorkflowPage({
  homepage,
  versions,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Homepage workflow</p>
            <h1 className="mt-2 font-news text-5xl text-zinc-950">{homepage.title}</h1>
          </div>

          <Link
            href="/admin/homepage"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
          >
            Back to homepages
          </Link>
        </div>

        <HomepageWorkflowEditor initialHomepage={hydrateHomepage(homepage) || homepage} initialVersions={versions} />
      </div>
    </AdminLayout>
  );
}
