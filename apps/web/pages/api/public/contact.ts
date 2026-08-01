import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  subject: z.string().trim().min(3).max(160),
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
      keyPrefix: "contact",
      max: 5,
      windowMs: 60 * 60 * 1000
    },
    "Too many contact requests from this connection. Please try again later."
  );
  if (!ok) return;

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide your name, email, subject, and message." });
  }

  try {
    const message = await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: "NEW"
      }
    });

    return res.status(201).json({
      id: message.id,
      message: "Your message has been sent to the London News team."
    });
  } catch {
    return res.status(503).json({ error: "Contact is temporarily unavailable." });
  }
}
