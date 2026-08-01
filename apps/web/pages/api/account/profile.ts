// apps/web/pages/api/account/profile.ts
import { compare, hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  applyRouteRateLimit,
  requireApiSession,
  requireMethod,
  requireSameOrigin,
  setNoStore
} from "../../../lib/server/api";
import { prisma } from "../../../utils/prisma";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email: z.string().trim().email("Enter a valid email address."),
    bio: z.string().trim().max(500, "Bio must be 500 characters or fewer.").optional().or(z.literal("")),
    avatar: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || /^https?:\/\//i.test(value), {
        message: "Avatar must be a valid image URL."
      }),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().min(12).max(128).optional().or(z.literal(""))
  })
  .refine((data) => !data.newPassword || Boolean(data.currentPassword), {
    message: "Enter your current password to set a new one.",
    path: ["currentPassword"]
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);

  const sessionUser = await requireApiSession(req, res);
  if (!sessionUser) return;

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatar: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    return res.status(200).json({
      user: {
        ...user,
        bio: user.bio || "",
        updatedAt: user.updatedAt.toISOString()
      }
    });
  }

  if (!requireMethod(req, res, ["PUT"])) return;
  if (!requireSameOrigin(req, res)) return;

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "account-profile",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many profile updates from this connection. Please try again shortly."
  );
  if (!ok) return;

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || "Invalid profile payload."
    });
  }

  const existing = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, passwordHash: true }
  });

  if (!existing) {
    return res.status(404).json({ error: "Account not found." });
  }

  const email = parsed.data.email.toLowerCase();
  if (email !== existing.email) {
    const conflict = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (conflict && conflict.id !== existing.id) {
      return res.status(409).json({ error: "A user with that email already exists." });
    }
  }

  const data: {
    name: string;
    email: string;
    bio: string;
    avatar: string | null;
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    email,
    bio: parsed.data.bio || "",
    avatar: parsed.data.avatar || null
  };

  if (parsed.data.newPassword) {
    const validCurrentPassword = await compare(parsed.data.currentPassword || "", existing.passwordHash);
    if (!validCurrentPassword) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
    data.passwordHash = await hash(parsed.data.newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatar: true,
      updatedAt: true
    }
  });

  return res.status(200).json({
    user: {
      ...updated,
      bio: updated.bio || "",
      updatedAt: updated.updatedAt.toISOString()
    }
  });
}