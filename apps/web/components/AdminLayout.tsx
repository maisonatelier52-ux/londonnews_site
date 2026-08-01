// apps/web/components/AdminLayout.tsx
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { UserAvatar } from "./admin/UserAvatar";
import { canManageAudience, canManageCategories, canManageClassifieds, canManageUsers, isEditorialRole, roleLabel } from "../utils/auth";

type NavItem = {
  href: string;
  label: string;
  show: boolean;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/articles", label: "Articles", show: true },
    { href: "/admin/audience", label: "Audience", show: canManageAudience(role) },
    { href: "/admin/classifieds", label: "Classifieds", show: canManageClassifieds(role) },
    { href: "/admin/categories", label: "Categories", show: canManageCategories(role) },
    { href: "/admin/homepage", label: "Homepage", show: isEditorialRole(role) },
    { href: "/admin/users", label: "Users", show: canManageUsers(role) }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.08),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.08),_transparent_20%),#f8f6f1] text-zinc-950">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[260px_1fr] lg:px-6">
      <aside className="paper-grid sticky top-6 self-start rounded-[2rem] border border-[#ddd7cb] bg-white/90 p-5 shadow-paper backdrop-blur lg:top-6">
        <Link href="/" className="block rounded-[1.5rem] border border-zinc-200 bg-stone-50 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">London News</p>
          <h1 className="mt-2 font-news text-3xl text-zinc-950">Desk</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Public site, editorial desk, audience tools, and homepage publishing workflow in one newsroom app.
          </p>
        </Link>

        <nav className="mt-6 space-y-2">
          {navItems.filter((item) => item.show).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-200 hover:bg-stone-50 hover:text-zinc-950"
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Open</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/admin/profile"
          className="mt-6 block rounded-[1.5rem] border border-zinc-200 bg-stone-50 px-4 py-4 transition hover:border-zinc-300 hover:bg-white"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Signed in</p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Edit profile</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <UserAvatar name={session?.user?.name} avatar={session?.user?.image} size={44} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-950">
                {session?.user?.name || "Newsroom user"}
              </p>
              <p className="truncate text-sm text-zinc-600">{session?.user?.email || "No email available"}</p>
            </div>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {roleLabel(role)}
          </span>
        </Link>

        <div className="mt-6 flex gap-2">
          <Link
            href="/"
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}