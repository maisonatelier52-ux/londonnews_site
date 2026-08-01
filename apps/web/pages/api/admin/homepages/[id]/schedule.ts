import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../utils/prisma";
import { canManageHomepage, hydrateHomepageVersion } from "../../../../../lib/admin/homepage-utils";
import { buildHomepagePreviewUrl, createHomepageVersion, sanitizeHomepageSnapshot } from "../../../../../lib/admin/homepage-workflow";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions as any);
  const currentUser = (session as any)?.user as { id?: string; role?: string } | undefined;
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
  const role = currentUser.role;
  if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;
  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-homepages",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many homepage changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const { id } = req.query as { id: string };
  const versionId = req.body?.versionId as string | undefined;
  const scheduledFor = req.body?.scheduledFor ? new Date(req.body.scheduledFor) : null;

  if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
    return res.status(400).json({ error: "A valid scheduledFor datetime is required" });
  }

  let version: any = null;

  if (versionId) {
    version = await prisma.homepageVersion.findUnique({ where: { id: versionId } });
    if (!version || version.homepageId !== id) return res.status(404).json({ error: "Version not found" });

    version = await prisma.homepageVersion.update({
      where: { id: versionId },
      data: {
        status: "SCHEDULED" as any,
        scheduledFor,
      },
    });
  } else {
    const snapshot = sanitizeHomepageSnapshot(req.body?.payload || {});
    version = await createHomepageVersion({
      homepageId: id,
      label: String(req.body?.label || `Scheduled ${scheduledFor.toLocaleString()}`),
      status: "SCHEDULED",
      scheduledFor,
      createdById: currentUser.id || null,
      snapshot,
    });
  }

  await prisma.homepageVersion.updateMany({
    where: {
      homepageId: id,
      id: { not: version.id },
      status: "SCHEDULED" as any,
    },
    data: { status: "ARCHIVED" as any, scheduledFor: null },
  });

  return res.status(200).json({
    ...hydrateHomepageVersion(version),
    previewUrl: buildHomepagePreviewUrl(version.previewToken),
  });
}
