import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]";
import { canDeleteCategories, canManageCategories } from "../../../../utils/auth";
import { slugify } from "../../../../utils/slug";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { categoryRevalidateTargets, revalidatePaths } from "../../../../lib/server/revalidate";
import { prisma } from "../../../../utils/prisma";

async function normalizeCategoryInput(body: Record<string, unknown>, currentId: string) {
  const name = String(body.name || "").trim();
  const rawSlug = String(body.slug || name).trim();
  const rawParentId = String(body.parentId || "").trim();
  const rawParentSlug = slugify(String(body.parentSlug || "").trim());
  let parentId = rawParentId || null;

  const currentCategory = await prisma.section.findUnique({
    where: { id: currentId },
    select: {
      id: true,
      _count: {
        select: {
          children: true
        }
      }
    }
  });

  if (!currentCategory) {
    return { error: "Category not found." };
  }

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

  if (parentId === currentId) {
    return { error: "A category cannot be its own parent." };
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

    if (currentCategory._count.children > 0) {
      return { error: "A desk with topic pages cannot be moved under another parent." };
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

  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    if (!canManageCategories(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const category = await prisma.section.findUnique({
      where: { id },
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
        },
        children: {
          orderBy: [{ position: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!category) return res.status(404).json({ error: "Category not found." });
    return res.status(200).json(category);
  }

  if (req.method === "PUT") {
    if (!canManageCategories(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

    const normalized = await normalizeCategoryInput(req.body || {}, id);

    if ("error" in normalized) {
      return res.status(normalized.error === "Category not found." ? 404 : 400).json({ error: normalized.error });
    }

    const payload = normalized.payload;
    if (!payload.name || !payload.slug) {
      return res.status(400).json({ error: "Category name and slug are required." });
    }

    try {
      const updated = await prisma.section.update({
        where: { id },
        data: payload,
        include: {
          parent: {
            select: {
              slug: true
            }
          }
        }
      });
      await revalidatePaths(res, categoryRevalidateTargets(updated));
      return res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: "A category with that slug already exists." });
      }

      return res.status(500).json({ error: "Failed to update category." });
    }
  }

  if (req.method === "DELETE") {
    if (!canDeleteCategories(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

    const category = await prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            children: true
          }
        },
        parent: {
          select: {
            slug: true
          }
        }
      }
    });

    if (!category) return res.status(404).json({ error: "Category not found." });
    if (category._count.articles > 0) {
      return res.status(400).json({ error: "Cannot delete a category that still has articles attached." });
    }
    if (category._count.children > 0) {
      return res.status(400).json({ error: "Cannot delete a parent category that still has child categories." });
    }

    await prisma.section.delete({ where: { id } });
    await revalidatePaths(res, categoryRevalidateTargets(category));
    return res.status(204).end();
  }

  return requireMethod(req, res, ["GET", "PUT", "DELETE"]);
}
