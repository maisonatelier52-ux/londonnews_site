import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { ClassifiedEditor } from "../../../components/admin/ClassifiedEditor";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { authOptions } from "../../api/auth/[...nextauth]";
import { setNoStore } from "../../../lib/server/api";
import { canManageClassifieds } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canManageClassifieds(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const id = params?.id as string;
  const classified = await prisma.classifiedListing.findUnique({
    where: { id },
    include: {
      submittedBy: true,
      enquiries: {
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      }
    }
  });

  if (!classified) return { notFound: true };

  return {
    props: {
      role: session.user.role,
      classified: {
        id: classified.id,
        title: classified.title,
        slug: classified.slug,
        category: classified.category,
        price: classified.price,
        location: classified.location,
        summary: classified.summary,
        description: classified.description,
        image: classified.image || "",
        sellerName: classified.sellerName,
        sellerEmail: classified.sellerEmail,
        sellerPhone: classified.sellerPhone || "",
        featured: classified.featured,
        reviewNotes: classified.reviewNotes || "",
        status: classified.status,
        submittedAt: classified.submittedAt?.toISOString() || null,
        publishedAt: classified.publishedAt?.toISOString() || null,
        expiresAt: classified.expiresAt?.toISOString().slice(0, 10) || ""
      },
      meta: {
        submitterName: classified.submittedBy?.name || classified.sellerName,
        sellerEmail: classified.sellerEmail
      },
      enquiries: JSON.parse(JSON.stringify(classified.enquiries))
    }
  };
};

export default function ClassifiedDetailPage({
  role,
  classified,
  meta,
  enquiries
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Listing detail</p>
          <h1 className="mt-2 font-news text-5xl text-zinc-950">{classified.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{classified.category}</span>
            <span>•</span>
            <span>{meta.submitterName}</span>
            <span>•</span>
            <span>{meta.sellerEmail}</span>
            <StatusBadge label={classified.status} />
          </div>
        </div>
        <Link
          href="/admin/classifieds"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
        >
          Back to classifieds
        </Link>
      </div>

      <ClassifiedEditor initialClassified={classified} role={role} />

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Audience responses</p>
        <h2 className="mt-2 font-news text-3xl text-zinc-950">Classified enquiries</h2>
        <div className="mt-5 space-y-4">
          {enquiries.map((enquiry: any) => (
            <article key={enquiry.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-950">
                  {enquiry.name} • {enquiry.email}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(enquiry.createdAt).toLocaleString()}
                </p>
              </div>
              {enquiry.phone ? (
                <p className="mt-2 text-sm text-zinc-600">Phone: {enquiry.phone}</p>
              ) : null}
              <p className="mt-3 text-sm leading-7 text-zinc-700">{enquiry.message}</p>
            </article>
          ))}

          {enquiries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-4 text-sm text-zinc-500">
              No reader enquiries have been captured for this listing yet.
            </div>
          ) : null}
        </div>
      </section>
    </AdminLayout>
  );
}
