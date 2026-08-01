import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveHomepageData } from "../../../lib/cms/queries/homepage";
import { requireMethod, setPublicApiCache } from "../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const data = await getActiveHomepageData();
    if (!data) return res.status(404).json({ error: "No active homepage configured" });
    setPublicApiCache(res, { sMaxAge: 60, staleWhileRevalidate: 300 });
    return res.status(200).json(data);
  } catch {
    return res.status(503).json({ error: "Homepage data is temporarily unavailable." });
  }
}
