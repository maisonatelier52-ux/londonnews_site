import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { isGuestRegistrationEnabled } from "../lib/security/env";
import { authOptions } from "./api/auth/[...nextauth]";

type RegisterPageProps = {
  registrationEnabled: boolean;
};

export const getServerSideProps: GetServerSideProps<RegisterPageProps> = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);
  if (session?.user) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false
      }
    };
  }

  return {
    props: {
      registrationEnabled: isGuestRegistrationEnabled()
    }
  };
};

export default function RegisterPage({ registrationEnabled }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setBusy(false);
      setError(data?.error || "Unable to create your account.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin"
    });

    setBusy(false);
    if (signInResult?.error) {
      setError("Account created, but automatic sign-in failed.");
      return;
    }

    window.location.href = signInResult?.url || "/admin";
  }

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-950">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#ddd7cb] bg-white p-8 shadow-paper">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Guest writer signup</p>
          <h1 className="mt-4 font-news text-5xl leading-tight text-zinc-950">Signup is invitation-only</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-700">
            Guest-writer self-registration is closed on this environment. Please ask an editor or administrator to create an account before signing in.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-[#ddd7cb] bg-white p-8 shadow-paper">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Guest writer signup</p>
        <h1 className="mt-4 font-news text-5xl text-zinc-950">Join the desk</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-700">
          Guest writers can draft stories and submit them into the editorial review queue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          Already have a login?{" "}
          <Link href="/login" className="font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4">
            Go to sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
