import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../utils/prisma";
import { stringifyJsonField } from "../../../../utils/json";
import { canDeleteHomepage, canManageHomepage, hydrateHomepage, normalizeSections, slugifyLite } from "../../../../lib/admin/homepage-utils";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { homepageRevalidateTargets, revalidatePaths } from "../../../../lib/server/revalidate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

    const homepage = await prisma.homepage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            slots: {
              orderBy: { position: "asc" },
              include: {
                article: {
                  include: {
                    section: true,
                    seo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!homepage) return res.status(404).json({ error: "Homepage not found" });
    return res.status(200).json(hydrateHomepage(homepage));
  }

  if (req.method === "PUT") {
    if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });
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

    const body = req.body || {};
    const sections = normalizeSections(Array.isArray(body.sections) ? body.sections : []);

    const existing = await prisma.homepage.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Homepage not found" });

    const nextSlug = slugifyLite(String(body.slug || existing.slug || existing.title || "homepage")) || existing.slug;

    try {
      await prisma.$transaction(async (tx) => {
        if (body.isActive) {
          await tx.homepage.updateMany({
            where: { NOT: { id } },
            data: { isActive: false },
          });
        }

        await tx.homepage.update({
          where: { id },
          data: {
            title: String(body.title || existing.title),
            slug: nextSlug,
            seoTitle: body.seoTitle ?? null,
            seoDescription: body.seoDescription ?? null,
            seoImage: body.seoImage ?? null,
            isActive: Boolean(body.isActive),
            settings: stringifyJsonField(body.settings || {}),
          },
        });

        await tx.homepageSection.deleteMany({
          where: { homepageId: id },
        });

        for (const section of sections) {
          await tx.homepageSection.create({
            data: {
              homepageId: id,
              key: section.key,
              kind: section.kind as any,
              title: section.title || null,
              position: section.position,
              settings: stringifyJsonField(section.settings || {}),
              slots: {
                create: (section.slots || []).map((slot) => ({
                  position: slot.position,
                  articleId: slot.articleId || null,
                  titleOverride: slot.titleOverride || null,
                  excerptOverride: slot.excerptOverride || null,
                  imageOverride: slot.imageOverride || null,
                  hrefOverride: slot.hrefOverride || null,
                  kickerOverride: slot.kickerOverride || null,
                  settings: stringifyJsonField(slot.settings || {}),
                })),
              },
            },
          });
        }
      });

      const saved = await prisma.homepage.findUnique({
        where: { id },
        include: {
          sections: {
            orderBy: { position: "asc" },
            include: {
              slots: {
                orderBy: { position: "asc" },
                include: {
                  article: {
                    include: {
                      section: true,
                      seo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (saved?.isActive) {
        await revalidatePaths(res, homepageRevalidateTargets());
      }

      return res.status(200).json(hydrateHomepage(saved));
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "Failed to save homepage" });
    }
  }

  if (req.method === "DELETE") {
    if (!canDeleteHomepage(role)) return res.status(403).json({ error: "Forbidden" });
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

    const existing = await prisma.homepage.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Homepage not found" });
    if (existing.isActive) return res.status(400).json({ error: "Cannot delete the active homepage" });

    await prisma.homepage.delete({ where: { id } });
    return res.status(204).end();
  }

  return requireMethod(req, res, ["GET", "PUT", "DELETE"]);
}
