// apps/web/pages/admin/profile.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type FormEvent, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { MediaUploadField } from "../../components/admin/MediaUploadField";
import { UserAvatar } from "../../components/admin/UserAvatar";
import { getAdminUserById } from "../../lib/admin/users";
import { setNoStore } from "../../lib/server/api";
import { formatDateTime } from "../../lib/format-date";
import { roleLabel } from "../../utils/auth";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  name: string;
  email: string;
  role: string;
  bio: string;
  avatar: string | null;
  updatedAt: string;
  counts: {
    articles: number;
    articleRevisions: number;
    articleCorrections: number;
    classifieds: number;
    homepageVersions: number;
  };
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ req, res }) => {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const user = await getAdminUserById(session.user.id);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return {
    props: {
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar: user.avatar,
      updatedAt: user.updatedAt,
      counts: user.counts
    }
  };
};

export default function ProfilePage({
  name: initialName,
  email: initialEmail,
  role,
  bio: initialBio,
  avatar: initialAvatar,
  updatedAt,
  counts
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);
  const [avatar, setAvatar] = useState(initialAvatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);

    const response = await fetch("/api/account/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        bio,
        avatar,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBusy(false);
      setError(payload.error || "Unable to save your profile.");
      return;
    }

    // Refresh the NextAuth session/JWT so the sidebar (and anywhere else
    // that reads useSession()) immediately reflects the new name/avatar.
    await update();

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setBusy(false);
    setSuccess("Profile updated.");
    router.replace(router.asPath);
  }

  return (
    <AdminLayout>
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Account</p>
        <h1 className="mt-2 font-news text-5xl text-zinc-950">My profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
          Update how your byline appears across the newsroom desk — your display name, profile photo, and short bio.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-5">
          <UserAvatar name={name} avatar={avatar} size={64} />
          <div>
            <p className="text-base font-semibold text-zinc-950">{name}</p>
            <p className="text-sm text-zinc-600">{email}</p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
              {roleLabel(role)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Articles</p>
            <p className="mt-2 text-xl font-semibold text-zinc-950">{counts.articles}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Revisions</p>
            <p className="mt-2 text-xl font-semibold text-zinc-950">{counts.articleRevisions}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Corrections</p>
            <p className="mt-2 text-xl font-semibold text-zinc-950">{counts.articleCorrections}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Classifieds</p>
            <p className="mt-2 text-xl font-semibold text-zinc-950">{counts.classifieds}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-stone-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Homepage versions</p>
            <p className="mt-2 text-xl font-semibold text-zinc-950">{counts.homepageVersions}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
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
          </div>

          <MediaUploadField
            label="Profile photo"
            value={avatar}
            onChange={setAvatar}
            folder="avatars"
            placeholder="https://... (or upload an image)"
            helperText="Square images work best. Uploading a new photo replaces the URL below."
          />

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
              placeholder="A short line about your beat, background, or focus at the desk."
            />
            <span className="mt-1 block text-right text-xs text-zinc-400">{bio.length}/500</span>
          </label>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Change password</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Leave these fields blank to keep your current password.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Current password
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                  autoComplete="current-password"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  New password
                </span>
                <input
                  type="password"
                  minLength={12}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                  placeholder="Minimum 12 characters"
                  autoComplete="new-password"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Confirm new password
                </span>
                <input
                  type="password"
                  minLength={12}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                  autoComplete="new-password"
                />
              </label>
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : null}

          {success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Last updated {formatDateTime(updatedAt)}
            </p>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-zinc-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}