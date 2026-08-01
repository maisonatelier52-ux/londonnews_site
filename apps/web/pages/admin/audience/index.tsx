import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import type { ReactNode } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { authOptions } from "../../api/auth/[...nextauth]";
import { setNoStore } from "../../../lib/server/api";
import { canManageAudience } from "../../../utils/auth";
import { prisma } from "../../../utils/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canManageAudience(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  const [subscribers, messages, enquiries] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 25
    }).catch(() => []),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 25
    }).catch(() => []),
    prisma.classifiedEnquiry.findMany({
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }).catch(() => [])
  ]);

  return {
    props: {
      subscribers: JSON.parse(JSON.stringify(subscribers)),
      messages: JSON.parse(JSON.stringify(messages)),
      enquiries: JSON.parse(JSON.stringify(enquiries))
    }
  };
};

export default function AudiencePage({
  subscribers,
  messages,
  enquiries
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Audience desk</p>
        <h1 className="mt-2 font-news text-5xl text-zinc-950">Readers, signups, and enquiries</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
          Review newsletter signups, public contact messages, and moderated classifieds enquiries from one newsroom surface.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <StatCard label="Subscribers" value={subscribers.length} helper="Latest newsletter signups stored in the app database." />
        <StatCard label="Contact messages" value={messages.length} helper="Reader and commercial requests sent through the public contact form." />
        <StatCard label="Classified enquiries" value={enquiries.length} helper="Buyer and seller leads routed through the moderated contact flow." />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <AudienceColumn
          title="Newsletter subscribers"
          empty="No newsletter signups yet."
          items={subscribers.map((subscriber: any) => (
            <article key={subscriber.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">{subscriber.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{subscriber.source}</p>
              <p className="mt-2 text-sm text-zinc-600">
                {new Date(subscriber.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        />

        <AudienceColumn
          title="Contact messages"
          empty="No public contact messages yet."
          items={messages.map((message: any) => (
            <article key={message.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">{message.subject}</p>
              <p className="mt-2 text-sm text-zinc-600">
                {message.name} • {message.email}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{message.message}</p>
            </article>
          ))}
        />

        <AudienceColumn
          title="Classified enquiries"
          empty="No moderated classifieds enquiries yet."
          items={enquiries.map((enquiry: any) => (
            <article key={enquiry.id} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">{enquiry.listing?.title || "Listing unavailable"}</p>
              {enquiry.listing?.id ? (
                <Link href={`/admin/classifieds/${enquiry.listing.id}`} className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Open listing
                </Link>
              ) : null}
              <p className="mt-3 text-sm text-zinc-600">
                {enquiry.name} • {enquiry.email}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{enquiry.message}</p>
            </article>
          ))}
        />
      </section>
    </AdminLayout>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{helper}</p>
    </article>
  );
}

function AudienceColumn({
  title,
  items,
  empty
}: {
  title: string;
  items: ReactNode[];
  empty: string;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-news text-3xl text-zinc-950">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length ? items : (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-4 text-sm text-zinc-500">
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}
