import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
import { prisma } from "../../../../../utils/prisma";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(50).optional().default(""),
  message: z.string().trim().min(20).max(4000)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "classified-enquiry",
      max: 5,
      windowMs: 60 * 60 * 1000
    },
    "Too many enquiries from this connection. Please try again later."
  );
  if (!ok) return;

  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide your contact details and enquiry message." });
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  if (!slug) {
    return res.status(400).json({ error: "Listing slug is required." });
  }

  try {
    const listing = await prisma.classifiedListing.findUnique({
      where: { slug },
      select: { id: true, status: true, publishedAt: true }
    });

    if (!listing || listing.status !== "APPROVED" || !listing.publishedAt) {
      return res.status(404).json({ error: "Listing not found." });
    }

    const enquiry = await prisma.classifiedEnquiry.create({
      data: {
        listingId: listing.id,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        status: "NEW"
      }
    });

    return res.status(201).json({
      id: enquiry.id,
      message: "Your enquiry has been sent to the London News classifieds desk."
    });
  } catch {
    return res.status(503).json({ error: "Classifieds enquiries are temporarily unavailable." });
  }
}
