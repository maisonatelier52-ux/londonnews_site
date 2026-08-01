import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { canDeleteClassifieds, canManageClassifieds } from "../../../../utils/auth";
import {
  classifiedAdminSchema,
  resolveClassifiedState,
  toStoredClassifiedDescription,
  uniqueClassifiedSlug
} from "../../../../lib/classifieds/workflow";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { classifiedRevalidateTargets, revalidatePaths } from "../../../../lib/server/revalidate";
import { prisma } from "../../../../utils/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  if (!canManageClassifieds(session.user.role)) return res.status(403).json({ error: "Forbidden" });

  const { id } = req.query as { id: string };
  const listing = await prisma.classifiedListing.findUnique({
    where: { id },
    include: {
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!listing) return res.status(404).json({ error: "Listing not found." });

  if (req.method === "GET") {
    return res.status(200).json(listing);
  }

  if (req.method === "DELETE") {
    if (!canDeleteClassifieds(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!requireSameOrigin(req, res)) return;
    const ok = await applyRouteRateLimit(
      req,
      res,
      {
        keyPrefix: "admin-classifieds",
        max: 25,
        windowMs: 10 * 60 * 1000
      },
      "Too many classifieds changes from this connection. Please try again shortly."
    );
    if (!ok) return;

    await prisma.classifiedListing.delete({ where: { id } });
    await revalidatePaths(res, classifiedRevalidateTargets(listing.slug));
    return res.status(204).end();
  }

  if (!requireMethod(req, res, ["GET", "PUT", "DELETE"])) return;
  if (!requireSameOrigin(req, res)) return;
  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-classifieds",
      max: 25,
      windowMs: 10 * 60 * 1000
    },
    "Too many classifieds changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const parsed = classifiedAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid classifieds payload." });
  }

  const payload = parsed.data;
  const slug = await uniqueClassifiedSlug(payload.slug || payload.title, id);
  const state = resolveClassifiedState(payload.action, {
    submittedAt: listing.submittedAt,
    publishedAt: listing.publishedAt
  });

  const saved = await prisma.classifiedListing.update({
    where: { id },
    data: {
      title: payload.title,
      slug,
      category: payload.category,
      price: payload.price,
      location: payload.location,
      summary: payload.summary,
      description: toStoredClassifiedDescription(payload.description),
      image: payload.image || null,
      sellerName: payload.sellerName,
      sellerEmail: payload.sellerEmail.toLowerCase(),
      sellerPhone: payload.sellerPhone || null,
      featured: Boolean(payload.featured),
      reviewNotes: payload.reviewNotes || null,
      status: state.status,
      submittedAt: state.submittedAt,
      publishedAt: state.publishedAt,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null
    }
  });

  await revalidatePaths(res, classifiedRevalidateTargets(saved.slug));

  return res.status(200).json({
    id: saved.id,
    title: saved.title,
    slug: saved.slug,
    category: saved.category,
    price: saved.price,
    location: saved.location,
    summary: saved.summary,
    description: saved.description,
    image: saved.image || "",
    sellerName: saved.sellerName,
    sellerEmail: saved.sellerEmail,
    sellerPhone: saved.sellerPhone || "",
    featured: saved.featured,
    reviewNotes: saved.reviewNotes || "",
    status: saved.status,
    submittedAt: saved.submittedAt?.toISOString() || null,
    publishedAt: saved.publishedAt?.toISOString() || null,
    expiresAt: saved.expiresAt?.toISOString().slice(0, 10) || ""
  });
}