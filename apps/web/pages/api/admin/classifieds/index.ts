import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { canManageClassifieds } from "../../../../utils/auth";
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

  if (req.method === "GET") {
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const rows = await prisma.classifiedListing.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ updatedAt: "desc" }],
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

    return res.status(200).json(rows);
  }

  if (!requireMethod(req, res, ["GET", "POST"])) return;
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
  const slug = await uniqueClassifiedSlug(payload.slug || payload.title);
  const state = resolveClassifiedState(payload.action);

  const listing = await prisma.classifiedListing.create({
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
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      submittedById: session.user.id
    }
  });

  await revalidatePaths(res, classifiedRevalidateTargets(listing.slug));

  return res.status(201).json({ id: listing.id });
}
