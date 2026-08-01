// apps/web/lib/auth/options.ts
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { logEvent } from "../server/logger";
import { prisma } from "../../utils/prisma";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function useSecureCookies() {
  const publicUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return publicUrl.startsWith("https://") || Boolean(process.env.VERCEL_ENV);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  useSecureCookies: useSecureCookies(),
  providers: [
    CredentialsProvider({
      name: "London News login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() }
          });

          if (!user) {
            return null;
          }

          const valid = await compare(parsed.data.password, user.passwordHash);
          if (!valid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio
          };
        } catch (error) {
          logEvent("error", "auth.authorize_failed", {
            email: parsed.data.email.toLowerCase(),
            error
          });
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar ?? null;
        token.bio = user.bio ?? null;
      }

      // The profile page calls `update()` on the client after saving changes
      // (see pages/admin/profile.tsx). Re-read the latest name/avatar/bio
      // from the database here so the session picks them up immediately
      // instead of waiting for the JWT to naturally expire and refresh.
      if (trigger === "update" && token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { name: true, avatar: true, bio: true, role: true }
          });

          if (fresh) {
            token.name = fresh.name;
            token.avatar = fresh.avatar ?? null;
            token.bio = fresh.bio ?? null;
            token.role = fresh.role;
          }
        } catch (error) {
          logEvent("error", "auth.session_refresh_failed", { userId: token.id, error });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "GUEST_WRITER");
        session.user.name = token.name || session.user.name;
        session.user.image = token.avatar ?? null;
        session.user.bio = token.bio ?? null;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
// import { compare } from "bcryptjs";
// import type { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { z } from "zod";
// import { logEvent } from "../server/logger";
// import { prisma } from "../../utils/prisma";

// export const credentialsSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(8)
// });

// function useSecureCookies() {
//   const publicUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
//   return publicUrl.startsWith("https://") || Boolean(process.env.VERCEL_ENV);
// }

// export const authOptions: NextAuthOptions = {
//   session: {
//     strategy: "jwt"
//   },
//   pages: {
//     signIn: "/login"
//   },
//   useSecureCookies: useSecureCookies(),
//   providers: [
//     CredentialsProvider({
//       name: "London News login",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         const parsed = credentialsSchema.safeParse(credentials);
//         if (!parsed.success) {
//           return null;
//         }

//         try {
//           const user = await prisma.user.findUnique({
//             where: { email: parsed.data.email.toLowerCase() }
//           });

//           if (!user) {
//             return null;
//           }

//           const valid = await compare(parsed.data.password, user.passwordHash);
//           if (!valid) {
//             return null;
//           }

//           return {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//             role: user.role
//           };
//         } catch (error) {
//           logEvent("error", "auth.authorize_failed", {
//             email: parsed.data.email.toLowerCase(),
//             error
//           });
//           return null;
//         }
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = user.role;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = String(token.id || "");
//         session.user.role = String(token.role || "GUEST_WRITER");
//       }
//       return session;
//     }
//   },
//   secret: process.env.NEXTAUTH_SECRET
// };
