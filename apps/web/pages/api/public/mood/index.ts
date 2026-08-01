import type { NextApiRequest, NextApiResponse } from "next";
import { getActiveMoodWidgetView } from "../../../../lib/cms/queries/mood";
import { MOOD_VISITOR_COOKIE, readNamedCookie } from "../../../../lib/mood";
import { requireMethod, setPublicApiCache } from "../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const visitorId = readNamedCookie(req.headers.cookie, MOOD_VISITOR_COOKIE);
    const mood = await getActiveMoodWidgetView(visitorId);
    if (!mood) {
      return res.status(404).json({ error: "No active homepage is configured." });
    }
    setPublicApiCache(res, { sMaxAge: 30, staleWhileRevalidate: 120 });
    return res.status(200).json(mood);
  } catch {
    return res.status(503).json({ error: "Mood widget data is temporarily unavailable." });
  }
}
