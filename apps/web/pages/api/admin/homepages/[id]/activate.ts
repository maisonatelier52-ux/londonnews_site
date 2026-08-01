import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../utils/prisma";
import { canManageHomepage } from "../../../../../lib/admin/homepage-utils";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
import { homepageRevalidateTargets, revalidatePaths } from "../../../../../lib/server/revalidate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;
  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-homepages",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many homepage changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const { id } = req.query as { id: string };

  await prisma.$transaction([
    prisma.homepage.updateMany({
      where: {},
      data: { isActive: false },
    }),
    prisma.homepage.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);

  await revalidatePaths(res, homepageRevalidateTargets());

  return res.status(200).json({ ok: true, id });
}
