import type { NextApiRequest, NextApiResponse } from "next";
import { getPublicClassifiedListingBySlug } from "../../../../lib/cms/queries/classifieds";
import { requireMethod, setPublicApiCache } from "../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const slug = String(req.query.slug || "");
    const listing = await getPublicClassifiedListingBySlug(slug);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    setPublicApiCache(res, { sMaxAge: 120, staleWhileRevalidate: 900 });
    return res.status(200).json(listing);
  } catch {
    return res.status(503).json({ error: "Listing data is temporarily unavailable." });
  }
}
