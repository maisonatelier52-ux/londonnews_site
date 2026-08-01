import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
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
  const snapshot = sanitizeHomepageSnapshot(req.body?.payload || {});
  const label = String(req.body?.label || `Draft ${new Date().toLocaleString()}`);

  const version = await createHomepageVersion({
    homepageId: id,
    label,
    status: "DRAFT",
    createdById: currentUser.id || null,
    snapshot,
  });

  return res.status(201).json({
    ...hydrateHomepageVersion(version),
    previewUrl: buildHomepagePreviewUrl(version.previewToken),
  });
}
