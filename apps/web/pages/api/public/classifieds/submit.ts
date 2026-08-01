import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import {
  classifiedSubmissionSchema,
  toStoredClassifiedDescription,
  uniqueClassifiedSlug
} from "../../../../lib/classifieds/workflow";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { prisma } from "../../../../utils/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const ok = await applyRouteRateLimit(req, res, {
    keyPrefix: "classified-submit",
    max: 5,
    windowMs: 60 * 60 * 1000
  }, "Too many classified submissions from this connection. Please try again later.");
  if (!ok) return;

  const parsed = classifiedSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Please provide the required listing, seller, and contact details."
    });
  }

  const session = await getServerSession(req, res, authOptions).catch(() => null);
  const payload = parsed.data;

  try {
    const slug = await uniqueClassifiedSlug(payload.title);
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
        status: "IN_REVIEW",
        submittedAt: new Date(),
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
        submittedById: session?.user?.id || null
      }
    });

    return res.status(201).json({
      id: listing.id,
      slug: listing.slug,
      message: "Your listing has been submitted for review."
    });
  } catch {
    return res.status(503).json({
      error: "Classified submission is temporarily unavailable."
    });
  }
}
