import { hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { listAdminUsers, getAdminUserById } from "../../../../lib/admin/users";
import {
  applyRouteRateLimit,
  requireApiSession,
  requireMethod,
  requireSameOrigin,
  setNoStore
} from "../../../../lib/server/api";
import { ROLE_OPTIONS, canManageUsers } from "../../../../utils/auth";
import { prisma } from "../../../../utils/prisma";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  role: z.enum(ROLE_OPTIONS),
  password: z.string().min(12).max(128)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);

  if (!requireMethod(req, res, ["GET", "POST"])) return;

  const session = await requireApiSession(req, res);
  if (!session) return;
  if (!canManageUsers(session.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    const users = await listAdminUsers();
    return res.status(200).json({ users });
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

  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid user payload." });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existing) {
    return res.status(409).json({ error: "A user with that email already exists." });
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      passwordHash
    },
    select: { id: true }
  });

  const user = await getAdminUserById(created.id);
  return res.status(201).json({ user });
}
