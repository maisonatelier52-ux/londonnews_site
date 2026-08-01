import { hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  isGuestRegistrationEnabled
} from "../../../lib/security/rate-limit";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  if (!isGuestRegistrationEnabled()) {
    return res.status(403).json({
      error: "Guest writer self-registration is currently closed. Please ask an editor or administrator to create an account."
    });
  }

  const ok = await applyRouteRateLimit(req, res, {
    keyPrefix: "register",
    max: 5,
    windowMs: 10 * 60 * 1000
  }, "Too many registration attempts. Please try again later.");
  if (!ok) return;

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please provide a valid name, email, and password." });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "GUEST_WRITER"
      }
    });

    return res.status(201).json({
      id: user.id,
      email: user.email
    });
  } catch {
    return res.status(503).json({
      error: "Registration is temporarily unavailable."
    });
  }
}
