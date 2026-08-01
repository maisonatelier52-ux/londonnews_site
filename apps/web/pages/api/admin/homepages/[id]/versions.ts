import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../utils/prisma";
import { buildHomepagePreviewUrl } from "../../../../../lib/admin/homepage-workflow";
import { canManageHomepage, hydrateHomepageVersion } from "../../../../../lib/admin/homepage-utils";
import { requireMethod, setNoStore } from "../../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

  if (!requireMethod(req, res, ["GET"])) return;

  const { id } = req.query as { id: string };
  const versions = await prisma.homepageVersion.findMany({
    where: { homepageId: id },
    orderBy: [{ updatedAt: "desc" }],
  });

  return res.status(200).json(
    versions.map((version) => ({
      ...hydrateHomepageVersion(version),
      previewUrl: buildHomepagePreviewUrl(version.previewToken),
    }))
  );
}
