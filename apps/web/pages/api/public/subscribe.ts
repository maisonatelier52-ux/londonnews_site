import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(120).optional().default(""),
  source: z.string().trim().max(80).optional().default("public")
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "subscribe",
      max: 8,
      windowMs: 60 * 60 * 1000
    },
    "Too many subscription attempts from this connection. Please try again later."
  );
  if (!ok) return;

  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const payload = parsed.data;

  try {
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: {
        email: payload.email.toLowerCase()
      },
      update: {
        name: payload.name || undefined,
        source: payload.source,
        status: "SUBSCRIBED"
      },
      create: {
        email: payload.email.toLowerCase(),
        name: payload.name || null,
        source: payload.source,
        status: "SUBSCRIBED"
      }
    });

    return res.status(200).json({
      id: subscriber.id,
      message: "You are now subscribed to London News updates."
    });
  } catch {
    return res.status(503).json({ error: "Subscription is temporarily unavailable." });
  }
}
