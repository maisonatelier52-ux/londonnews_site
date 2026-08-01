import { hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { countUserManagers, getAdminUserById } from "../../../../lib/admin/users";
import {
  applyRouteRateLimit,
  requireApiSession,
  requireMethod,
  requireSameOrigin,
  setNoStore
} from "../../../../lib/server/api";
import { ROLE_OPTIONS, canManageUsers } from "../../../../utils/auth";
import { prisma } from "../../../../utils/prisma";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  role: z.enum(ROLE_OPTIONS),
  password: z.string().min(12).max(128).optional().or(z.literal(""))
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);

  if (!requireMethod(req, res, ["PUT"])) return;

  const session = await requireApiSession(req, res);
  if (!session) return;
  if (!canManageUsers(session.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!requireSameOrigin(req, res)) return;
  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-users",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many user-management changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const userId = typeof req.query.id === "string" ? req.query.id : "";
  if (!userId) {
    return res.status(400).json({ error: "Missing user id." });
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid user payload." });
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true
    }
  });

  if (!existing) {
    return res.status(404).json({ error: "User not found." });
  }

  const email = parsed.data.email.toLowerCase();
  const conflict = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (conflict && conflict.id !== userId) {
    return res.status(409).json({ error: "A user with that email already exists." });
  }

  const nextRole = parsed.data.role;
  if (canManageUsers(existing.role) && !canManageUsers(nextRole)) {
    const remainingManagers = await countUserManagers(existing.id);
    if (remainingManagers < 1) {
      return res.status(400).json({ error: "At least one JMHV or Super Admin account must remain." });
    }
  }

  const data: {
    name: string;
    email: string;
    role: (typeof ROLE_OPTIONS)[number];
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    email,
    role: nextRole
  };

  if (parsed.data.password) {
    data.passwordHash = await hash(parsed.data.password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data
  });

  const user = await getAdminUserById(userId);
  return res.status(200).json({ user });
}
