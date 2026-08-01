import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../utils/prisma";
import { stringifyJsonField } from "../../../../utils/json";
import { buildDefaultHomepagePayload, canManageHomepage, normalizeSections, slugifyLite } from "../../../../lib/admin/homepage-utils";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { homepageRevalidateTargets, revalidatePaths } from "../../../../lib/server/revalidate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "GET") {
    const homepages = await prisma.homepage.findMany({
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      include: {
        _count: {
          select: { sections: true },
        },
      },
    });
    return res.status(200).json(homepages);
  }

  if (req.method === "POST") {
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

    const inputTitle = String(req.body?.title || "Homepage").trim();
    const payload = buildDefaultHomepagePayload(inputTitle);

    const exists = await prisma.homepage.findUnique({ where: { slug: payload.slug } });
    const slug = exists ? `${payload.slug}-${Date.now()}` : payload.slug;
    const isFirst = (await prisma.homepage.count()) === 0;

    const created = await prisma.homepage.create({
      data: {
        slug,
        title: payload.title,
        isActive: isFirst,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        seoImage: payload.seoImage,
        settings: stringifyJsonField(payload.settings),
        sections: {
          create: normalizeSections(payload.sections).map((section) => ({
            key: section.key,
            kind: section.kind as any,
            title: section.title,
            position: section.position,
            settings: stringifyJsonField(section.settings || {}),
          })),
        },
      },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: { slots: { orderBy: { position: "asc" } } },
        },
      },
    });

    if (created.isActive) {
      await revalidatePaths(res, homepageRevalidateTargets());
    }

    return res.status(201).json(created);
  }

  return requireMethod(req, res, ["GET", "POST"]);
}
