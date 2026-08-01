import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, setNoStore } from "../../lib/server/api";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["GET"])) return;

  return res.status(200).json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
}
