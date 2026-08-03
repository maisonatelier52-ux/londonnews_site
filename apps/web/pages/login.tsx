import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { isGuestRegistrationEnabled, isHostedRuntime } from "../lib/security/env";
import { authOptions } from "./api/auth/[...nextauth]";

type LoginPageProps = {
  registrationEnabled: boolean;
  showSeededCredentials: boolean;
};

export const getServerSideProps: GetServerSideProps<LoginPageProps> = async ({ req, res }) => {
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
      registrationEnabled: isGuestRegistrationEnabled(),
      showSeededCredentials: !isHostedRuntime()
    }
  };
};

export default function LoginPage({ registrationEnabled, showSeededCredentials }: LoginPageProps) {
  const [email, setEmail] = useState(showSeededCredentials ? "jmhv@londonnews.local" : "");
  const [password, setPassword] = useState(showSeededCredentials ? "LondonNews123!" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin"
    });

    setBusy(false);

    if (result?.error) {
      setError("Login failed. Confirm the configured database contains newsroom accounts and try again.");
      return;
    }

    window.location.href = result?.url || "/admin";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_18%),#f8f6f1] px-4 py-10 text-zinc-950">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#ddd7cb] bg-white shadow-paper lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-b border-[#ddd7cb] p-8 lg:border-b-0 lg:border-r lg:p-10">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">London News</p>
          <h1 className="mt-4 font-news text-5xl leading-tight text-zinc-950">Newsroom access</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-zinc-700">
            Sign in to manage articles, taxonomy, homepage curation, classifieds, audience responses, and newsroom publishing workflows.
          </p>

          {showSeededCredentials ? (
            <div className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-700">Local seed accounts</p>
              <p className="mt-3 text-sm leading-7 text-emerald-950">
                These demo credentials are for locally seeded development environments only. Hosted environments should use managed newsroom accounts created through `/admin/users`.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                <li><strong>Super Admin:</strong> `superadmin@londonnews.local`</li>
                <li><strong>JMHV:</strong> `jmhv@londonnews.local`</li>
                <li><strong>Editor 1:</strong> `editor1@londonnews.local`</li>
                <li><strong>Editor 2:</strong> `editor2@londonnews.local`</li>
                <li><strong>Journalist 1:</strong> `journalist1@londonnews.local`</li>
                <li><strong>Journalist 2:</strong> `journalist2@londonnews.local`</li>
                <li><strong>Guest Writer 1:</strong> `guestwriter1@londonnews.local`</li>
                <li><strong>Guest Writer 2:</strong> `guestwriter2@londonnews.local`</li>
              </ul>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-sky-800">Restricted access</p>
              <p className="mt-3 text-sm leading-7 text-sky-950">
                Newsroom access is limited to approved London News staff and contributors. Use your assigned credentials to continue.
              </p>
            </div>
          )}
        </section>

        <section className="p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Password</label>
              <input
                id="login-password"
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
              {busy ? "Signing in..." : "Enter newsroom"}
            </button>
          </form>

          {registrationEnabled ? (
            <p className="mt-6 text-sm leading-7 text-zinc-600">
              Need a guest-writer account?{" "}
              <Link href="/register" className="font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4">
                Create one here
              </Link>
              .
            </p>
          ) : (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              Guest-writer signup is invitation-only on this environment. Ask an editor or administrator to create the account.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}


// import type { GetServerSideProps } from "next";
// import Link from "next/link";
// import { getServerSession } from "next-auth/next";
// import { signIn } from "next-auth/react";
// import { type FormEvent, useState } from "react";
// import { isGuestRegistrationEnabled, isHostedRuntime } from "../lib/security/env";
// import { authOptions } from "./api/auth/[...nextauth]";

// type LoginPageProps = {
//   registrationEnabled: boolean;
//   showSeededCredentials: boolean;
// };

// export const getServerSideProps: GetServerSideProps<LoginPageProps> = async ({ req, res }) => {
//   const session = await getServerSession(req, res, authOptions);
//   if (session?.user) {
//     return {
//       redirect: {
//         destination: "/admin",
//         permanent: false
//       }
//     };
//   }

//   return {
//     props: {
//       registrationEnabled: isGuestRegistrationEnabled(),
//       showSeededCredentials: !isHostedRuntime()
//     }
//   };
// };

// export default function LoginPage({ registrationEnabled, showSeededCredentials }: LoginPageProps) {
//   const [email, setEmail] = useState(showSeededCredentials ? "jmhv@londonnews.local" : "");
//   const [password, setPassword] = useState(showSeededCredentials ? "LondonNews123!" : "");
//   const [error, setError] = useState("");
//   const [busy, setBusy] = useState(false);

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError("");

//     const result = await signIn("credentials", {
//       email,
//       password,
//       redirect: false,
//       callbackUrl: "/admin"
//     });

//     setBusy(false);

//     if (result?.error) {
//       setError("Login failed. Confirm the configured database contains newsroom accounts and try again.");
//       return;
//     }

//     window.location.href = result?.url || "/admin";
//   }

//   return (
//     <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_18%),#f8f6f1] px-4 py-10 text-zinc-950">
//       <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#ddd7cb] bg-white shadow-paper lg:grid lg:grid-cols-[1.1fr_0.9fr]">
//         <section className="border-b border-[#ddd7cb] p-8 lg:border-b-0 lg:border-r lg:p-10">
//           <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">London News</p>
//           <h1 className="mt-4 font-news text-5xl leading-tight text-zinc-950">Newsroom access</h1>
//           <p className="mt-4 max-w-xl text-base leading-8 text-zinc-700">
//             Sign in to manage articles, taxonomy, homepage curation, classifieds, audience responses, and newsroom publishing workflows.
//           </p>

//           {showSeededCredentials ? (
//             <div className="mt-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
//               <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-700">Local seed accounts</p>
//               <p className="mt-3 text-sm leading-7 text-emerald-950">
//                 These demo credentials are for locally seeded development environments only. Hosted environments should use managed newsroom accounts created through `/admin/users`.
//               </p>
//               <ul className="mt-3 space-y-2 text-sm text-emerald-950">
//                 <li><strong>Super Admin:</strong> `superadmin@londonnews.local`</li>
//                 <li><strong>JMHV:</strong> `jmhv@londonnews.local`</li>
//                 <li><strong>Editor 1:</strong> `editor1@londonnews.local`</li>
//                 <li><strong>Editor 2:</strong> `editor2@londonnews.local`</li>
//                 <li><strong>Journalist 1:</strong> `journalist1@londonnews.local`</li>
//                 <li><strong>Journalist 2:</strong> `journalist2@londonnews.local`</li>
//                 <li><strong>Guest Writer 1:</strong> `guestwriter1@londonnews.local`</li>
//                 <li><strong>Guest Writer 2:</strong> `guestwriter2@londonnews.local`</li>
//               </ul>
//             </div>
//           ) : (
//             <div className="mt-8 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
//               <p className="text-[11px] uppercase tracking-[0.24em] text-sky-800">Restricted access</p>
//               <p className="mt-3 text-sm leading-7 text-sky-950">
//                 Newsroom access is limited to approved London News staff and contributors. Use your assigned credentials to continue.
//               </p>
//             </div>
//           )}
//         </section>

//         <section className="p-8 lg:p-10">
//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div>
//               <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Email</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(event) => setEmail(event.target.value)}
//                 className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Password</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(event) => setPassword(event.target.value)}
//                 className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
//               />
//             </div>

//             {error ? <p className="text-sm text-rose-700">{error}</p> : null}

//             <button
//               type="submit"
//               disabled={busy}
//               className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white disabled:opacity-50"
//             >
//               {busy ? "Signing in..." : "Enter newsroom"}
//             </button>
//           </form>

//           {registrationEnabled ? (
//             <p className="mt-6 text-sm leading-7 text-zinc-600">
//               Need a guest-writer account?{" "}
//               <Link href="/register" className="font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4">
//                 Create one here
//               </Link>
//               .
//             </p>
//           ) : (
//             <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
//               Guest-writer signup is invitation-only on this environment. Ask an editor or administrator to create the account.
//             </p>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }
