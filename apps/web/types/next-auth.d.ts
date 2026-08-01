// apps/web/types/next-auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      bio?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    avatar?: string | null;
    bio?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    avatar?: string | null;
    bio?: string | null;
  }
}
// import type { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: DefaultSession["user"] & {
//       id: string;
//       role: string;
//     };
//   }

//   interface User {
//     id: string;
//     role: string;
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     id?: string;
//     role?: string;
//   }
// }
