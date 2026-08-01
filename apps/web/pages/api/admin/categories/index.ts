import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]";
import { slugify } from "../../../../utils/slug";
import { canManageCategories } from "../../../../utils/auth";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { categoryRevalidateTargets, revalidatePaths } from "../../../../lib/server/revalidate";
import { prisma } from "../../../../utils/prisma";

async function normalizeCategoryInput(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const rawSlug = String(body.slug || name).trim();
  const rawParentId = String(body.parentId || "").trim();
  const rawParentSlug = slugify(String(body.parentSlug || "").trim());
  let parentId = rawParentId || null;

  if (!parentId && rawParentSlug) {
    const parentBySlug = await prisma.section.findUnique({
      where: { slug: rawParentSlug },
      select: {
        id: true,
        parentId: true
      }
    });

    if (!parentBySlug) {
      return { error: "Parent category not found." };
    }

    if (parentBySlug.parentId) {
      return { error: "Only top-level desks can own topic pages." };
    }

    parentId = parentBySlug.id;
  }

  if (parentId) {
    const parent = await prisma.section.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        slug: true,
        parentId: true
      }
    });

    if (!parent) {
      return { error: "Parent category not found." };
    }

    if (parent.slug === "classifieds") {
      return { error: "Classifieds is a dedicated public section and cannot own topic pages." };
    }

    if (parent.parentId) {
      return { error: "Only top-level desks can own topic pages." };
    }
  }

  return {
    payload: {
      name,
      slug: slugify(rawSlug),
      navLabel: String(body.navLabel || "").trim() || null,
      description: String(body.description || "").trim() || null,
      color: String(body.color || "").trim() || null,
      icon: String(body.icon || "").trim() || null,
      isVisible: body.isVisible !== false,
      showInTopNav: parentId ? false : Boolean(body.showInTopNav),
      position: Number(body.position || 999),
      premium: Boolean(body.premium),
      seoTitle: String(body.seoTitle || "").trim() || null,
      seoDescription: String(body.seoDescription || "").trim() || null,
      seoImage: String(body.seoImage || "").trim() || null,
      parentId
    }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  if (!canManageCategories(session.user.role)) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "GET") {
    const categories = await prisma.section.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            articles: true,
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return res.status(200).json(categories);
  }

  if (req.method === "POST") {
    if (!requireSameOrigin(req, res)) return;
    const ok = await applyRouteRateLimit(
      req,
      res,
      {
        keyPrefix: "admin-categories",
        max: 20,
        windowMs: 10 * 60 * 1000
      },
      "Too many taxonomy changes from this connection. Please try again shortly."
    );
    if (!ok) return;

    const normalized = await normalizeCategoryInput(req.body || {});

    if ("error" in normalized) {
      return res.status(400).json({ error: normalized.error });
    }

    const payload = normalized.payload;

    if (!payload.name) {
      return res.status(400).json({ error: "Category name is required." });
    }

    if (!payload.slug) {
      return res.status(400).json({ error: "Category slug is required." });
    }

    try {
      const created = await prisma.section.create({
        data: payload
      });
      const parent = payload.parentId
        ? await prisma.section.findUnique({
            where: { id: payload.parentId },
            select: {
              slug: true
            }
          })
        : null;
      await revalidatePaths(res, categoryRevalidateTargets({ ...created, parent }));
      return res.status(201).json(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: "A category with that slug already exists." });
      }

      return res.status(500).json({ error: "Failed to create category." });
    }
  }

  return requireMethod(req, res, ["GET", "POST"]);
}
