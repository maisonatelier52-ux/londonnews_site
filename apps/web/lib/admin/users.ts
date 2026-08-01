import type { Prisma } from "@prisma/client";
import { canManageUsers } from "../../utils/auth";
import { prisma } from "../../utils/prisma";
import { isSeededNewsroomEmail } from "../auth/seed-users";

export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  bio: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      articles: true,
      articleRevisions: true,
      articleCorrections: true,
      classifieds: true,
      homepageVersions: true
    }
  }
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

export type AdminUserView = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  isSeeded: boolean;
  isManager: boolean;
  counts: {
    articles: number;
    articleRevisions: number;
    articleCorrections: number;
    classifieds: number;
    homepageVersions: number;
    totalReferences: number;
  };
};

function serializeAdminUser(user: AdminUserRow): AdminUserView {
  const counts = {
    articles: user._count.articles,
    articleRevisions: user._count.articleRevisions,
    articleCorrections: user._count.articleCorrections,
    classifieds: user._count.classifieds,
    homepageVersions: user._count.homepageVersions
  };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || "",
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    isSeeded: isSeededNewsroomEmail(user.email),
    isManager: canManageUsers(user.role),
    counts: {
      ...counts,
      totalReferences:
        counts.articles +
        counts.articleRevisions +
        counts.articleCorrections +
        counts.classifieds +
        counts.homepageVersions
    }
  };
}

export async function listAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: adminUserSelect
  });

  return users.map(serializeAdminUser);
}

export async function getAdminUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: adminUserSelect
  });

  return user ? serializeAdminUser(user) : null;
}

export async function countUserManagers(excludeUserId?: string) {
  return prisma.user.count({
    where: {
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      role: {
        in: ["JMHV", "SUPERADMIN"]
      }
    }
  });
}
