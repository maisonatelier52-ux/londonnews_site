import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../utils/prisma";
import { canManageHomepage } from "../../../lib/admin/homepage-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const q = String(req.query.q || "").trim();
  const take = Math.min(Number(req.query.limit || 15), 30);

  const rows = await prisma.article.findMany({
    where: {
      status: "APPROVED",
      publishedAt: { not: null },
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { excerpt: { contains: q } },
              { dek: { contains: q } },
              { section: { is: { name: { contains: q } } } },
              { seo: { is: { slug: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      section: true,
      seo: true,
    },
    orderBy: { publishedAt: "desc" },
    take,
  }).catch(() => null);

  if (!rows) {
    return res.status(503).json({ error: "Database is not ready yet. Run `npm run db:setup` first." });
  }

  return res.status(200).json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      section: row.section?.name || row.section?.slug || "News",
      slug: row.seo?.slug || row.id,
      heroImage: row.heroImage || null,
      publishedAt: row.publishedAt,
    }))
  );
}
