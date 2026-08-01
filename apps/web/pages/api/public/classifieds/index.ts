import type { NextApiRequest, NextApiResponse } from "next";
import { getFeaturedPublicClassifiedListings, getPublicClassifiedListings } from "../../../../lib/cms/queries/classifieds";
import { requireMethod, setPublicApiCache } from "../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const mode = String(req.query.mode || "all");
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const listings =
      mode === "featured"
        ? await getFeaturedPublicClassifiedListings(limit || 2)
        : await getPublicClassifiedListings(limit);

    setPublicApiCache(res, { sMaxAge: 120, staleWhileRevalidate: 900 });
    return res.status(200).json(listings);
  } catch {
    return res.status(503).json({ error: "Classifieds are temporarily unavailable." });
  }
}
