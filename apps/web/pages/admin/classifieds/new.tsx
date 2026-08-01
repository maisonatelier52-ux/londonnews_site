import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import AdminLayout from "../../../components/AdminLayout";
import { ClassifiedEditor } from "../../../components/admin/ClassifiedEditor";
import { authOptions } from "../../api/auth/[...nextauth]";
import { setNoStore } from "../../../lib/server/api";
import { canManageClassifieds } from "../../../utils/auth";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canManageClassifieds(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  return {
    props: {
      role: session.user.role
    }
  };
};

export default function NewClassifiedPage({
  role
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Classifieds desk</p>
          <h1 className="mt-2 font-news text-5xl text-zinc-950">New listing</h1>
        </div>
        <Link
          href="/admin/classifieds"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-700"
        >
          Back to classifieds
        </Link>
      </div>

      <ClassifiedEditor
        isNew
        role={role}
        initialClassified={{
          title: "",
          slug: "",
          category: "",
          price: "",
          location: "",
          summary: "",
          description: "",
          image: "",
          sellerName: "",
          sellerEmail: "",
          sellerPhone: "",
          featured: false,
          reviewNotes: "",
          status: "DRAFT",
          submittedAt: null,
          publishedAt: null,
          expiresAt: ""
        }}
      />
    </AdminLayout>
  );
}
