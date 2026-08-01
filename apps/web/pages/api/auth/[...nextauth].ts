import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";
import { authOptions } from "../../../lib/auth/options";
import { applyRouteRateLimit, requireSameOrigin, setNoStore } from "../../../lib/server/api";
export { authOptions } from "../../../lib/auth/options";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);

  const route = req.query.nextauth;
  const routeParts = Array.isArray(route) ? route : [String(route || "")];
  const isCredentialsLogin =
    req.method === "POST" &&
    routeParts.includes("callback") &&
    routeParts.includes("credentials");

  if (isCredentialsLogin) {
    if (!requireSameOrigin(req, res)) {
      return;
    }

    const ok = await applyRouteRateLimit(req, res, {
      keyPrefix: "login",
      max: 10,
      windowMs: 10 * 60 * 1000
    }, "Too many login attempts. Please try again later.");
    if (!ok) {
      return;
    }
  }

  return NextAuth(req, res, authOptions);
}
