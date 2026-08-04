import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import type { AdminUserView } from "../../../lib/admin/users";
import { listAdminUsers } from "../../../lib/admin/users";
import { setNoStore } from "../../../lib/server/api";
import { formatDateTime } from "../../../lib/format-date";
import { authOptions } from "../../api/auth/[...nextauth]";
import { ROLE_OPTIONS, canManageUsers, roleLabel } from "../../../utils/auth";

type PageProps = {
  users: AdminUserView[];
  sessionUserId: string;
  dataUnavailable: boolean;
};

type Toast = { type: "success" | "error"; text: string } | null;

type EditableUserCardProps = {
  user: AdminUserView;
  sessionUserId: string;
  notify: (toast: NonNullable<Toast>) => void;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (!canManageUsers(session.user.role)) {
    return { redirect: { destination: "/admin", permanent: false } };
  }

  try {
    const users = await listAdminUsers();
    return {
      props: {
        users,
        sessionUserId: session.user.id,
        dataUnavailable: false
      }
    };
  } catch {
    return {
      props: {
        users: [],
        sessionUserId: session.user.id,
        dataUnavailable: true
      }
    };
  }
};

function CreateUserForm({ notify }: { notify: (toast: NonNullable<Toast>) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("EDITOR");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        role,
        password
      })
    });

    const payload = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      notify({ type: "error", text: payload.error || "Unable to create that account." });
      return;
    }

    notify({ type: "success", text: "User created." });
    await router.replace(router.asPath);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr_1fr_auto]">
      <label className="block">
        <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
          placeholder="Platform editor"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
          placeholder="editor@londonnews.internal"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Role</span>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Strong password</span>
        <input
          type="password"
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
          placeholder="Minimum 12 characters"
          required
        />
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create user"}
        </button>
      </div>
    </form>
  );
}

function EditableUserCard({ user, sessionUserId, notify }: EditableUserCardProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        role,
        password
      })
    });

    const payload = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      notify({ type: "error", text: payload.error || "Unable to save that user." });
      return;
    }

    setPassword("");
    notify({ type: "success", text: `Saved changes for ${name}.` });
    await router.replace(router.asPath);
  }

  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950">{user.name}</h2>
            {user.id === sessionUserId ? (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-800">
                Current session
              </span>
            ) : null}
            {user.isSeeded ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                Seeded identity
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {roleLabel(user.role)}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-700">
            {user.counts.totalReferences} references
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Articles</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{user.counts.articles}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Revisions</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{user.counts.articleRevisions}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Corrections</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{user.counts.articleCorrections}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Classifieds</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{user.counts.classifieds}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Homepage versions</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{user.counts.homepageVersions}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr_1fr_auto]">
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {roleLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">New password</span>
          <input
            type="password"
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
            placeholder="Leave blank to keep current password"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
        Updated {formatDateTime(user.updatedAt)}
      </p>
    </article>
  );
}

export default function UsersPage({
  users,
  sessionUserId,
  dataUnavailable
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const seededCount = users.filter((user) => user.isSeeded).length;
  const managerCount = users.filter((user) => user.isManager).length;
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <AdminLayout>
      {toast ? (
        <div
          role="status"
          className={`fixed right-6 top-6 z-50 max-w-sm rounded-2xl border px-5 py-4 text-sm font-semibold shadow-xl ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">User roles</p>
        <h1 className="mt-2 font-news text-5xl text-zinc-950">Newsroom access</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
          Replace seeded newsroom identities, create real staff accounts, and rotate credentials without losing article ownership or byline history.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Total accounts</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{users.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Seeded identities</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{seededCount}</p>
          </article>
          <article className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Manager accounts</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{managerCount}</p>
          </article>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Create account</p>
          <p className="mt-2 text-sm leading-7 text-zinc-700">
            Use 12+ character passwords. Leave existing user passwords blank unless you are rotating them intentionally.
          </p>
          <div className="mt-4">
            <CreateUserForm notify={setToast} />
          </div>
        </div>

        {dataUnavailable ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            User records are currently unavailable. Confirm the configured Postgres service is reachable.
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        {users.map((user) => (
          <EditableUserCard key={user.id} user={user} sessionUserId={sessionUserId} notify={setToast} />
        ))}

        {!dataUnavailable && users.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-8 text-center text-sm text-zinc-500">
            No users found. Create the first newsroom account above.
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}