// import type { NextApiRequest, NextApiResponse } from "next";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../../auth/[...nextauth]";
// import { prisma } from "../../../../../utils/prisma";
// import { parseJsonField } from "../../../../../utils/json";
// import { canManageHomepage } from "../../../../../lib/admin/homepage-utils";
// import { applyHomepageSnapshot, buildHomepagePreviewUrl, createHomepageVersion, sanitizeHomepageSnapshot } from "../../../../../lib/admin/homepage-workflow";
// import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
// import { homepageRevalidateTargets, revalidatePaths } from "../../../../../lib/server/revalidate";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   setNoStore(res);
//   const session = await getServerSession(req, res, authOptions as any);
//   const currentUser = (session as any)?.user as { id?: string; role?: string } | undefined;
//   if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
//   const role = currentUser.role;
//   if (!canManageHomepage(role)) return res.status(403).json({ error: "Forbidden" });

//   if (!requireMethod(req, res, ["POST"])) return;
//   if (!requireSameOrigin(req, res)) return;
//   const ok = await applyRouteRateLimit(
//     req,
//     res,
//     {
//       keyPrefix: "admin-homepages",
//       max: 20,
//       windowMs: 10 * 60 * 1000
//     },
//     "Too many homepage changes from this connection. Please try again shortly."
//   );
//   if (!ok) return;

//   const { id } = req.query as { id: string };
//   const versionId = req.body?.versionId as string | undefined;
//   const activate = req.body?.activate !== false;

//   let version: any = null;
//   let snapshot: any = null;

//   if (versionId) {
//     version = await prisma.homepageVersion.findUnique({
//       where: { id: versionId },
//     });
//     if (!version || version.homepageId !== id) {
//       return res.status(404).json({ error: "Version not found" });
//     }
//     snapshot = parseJsonField(version.snapshot, null);
//   } else {
//     snapshot = sanitizeHomepageSnapshot(req.body?.payload || {});
//     version = await createHomepageVersion({
//       homepageId: id,
//       label: String(req.body?.label || `Published ${new Date().toLocaleString()}`),
//       status: "PUBLISHED",
//       createdById: currentUser.id || null,
//       snapshot,
//     });
//   }

//   await applyHomepageSnapshot({
//     homepageId: id,
//     snapshot,
//     activate,
//   });

//   await prisma.$transaction([
//     prisma.homepageVersion.updateMany({
//       where: {
//         homepageId: id,
//         id: { not: version.id },
//         status: { in: ["PUBLISHED", "SCHEDULED"] as any },
//       },
//       data: { status: "ARCHIVED" as any, scheduledFor: null },
//     }),
//     prisma.homepageVersion.update({
//       where: { id: version.id },
//       data: {
//         status: "PUBLISHED" as any,
//         publishedAt: new Date(),
//         scheduledFor: null,
//       },
//     }),
//   ]);

//   const savedVersion = await prisma.homepageVersion.findUnique({ where: { id: version.id } });
//   await revalidatePaths(res, homepageRevalidateTargets());

//   return res.status(200).json({
//     ok: true,
//     version: savedVersion
//       ? {
//           ...savedVersion,
//           snapshot: parseJsonField(savedVersion.snapshot, {}),
//           previewUrl: buildHomepagePreviewUrl(savedVersion.previewToken)
//         }
//       : null,
//   });
// }


import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { prisma } from "../../../../../utils/prisma";
import { parseJsonField } from "../../../../../utils/json";
import { canManageHomepage } from "../../../../../lib/admin/homepage-utils";
import { applyHomepageSnapshot, buildHomepagePreviewUrl, createHomepageVersion, sanitizeHomepageSnapshot } from "../../../../../lib/admin/homepage-workflow";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
import { homepageRevalidateTargets, revalidatePaths } from "../../../../../lib/server/revalidate";

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
  const activate = req.body?.activate !== false;

  try {
    let version: any = null;
    let snapshot: any = null;

    if (versionId) {
      version = await prisma.homepageVersion.findUnique({
        where: { id: versionId },
      });
      if (!version || version.homepageId !== id) {
        return res.status(404).json({ error: "Version not found" });
      }
      snapshot = parseJsonField(version.snapshot, null);
    } else {
      snapshot = sanitizeHomepageSnapshot(req.body?.payload || {});
      version = await createHomepageVersion({
        homepageId: id,
        label: String(req.body?.label || `Published ${new Date().toLocaleString()}`),
        status: "PUBLISHED",
        createdById: currentUser.id || null,
        snapshot,
      });
    }

    await applyHomepageSnapshot({
      homepageId: id,
      snapshot,
      activate,
    });

    await prisma.$transaction([
      prisma.homepageVersion.updateMany({
        where: {
          homepageId: id,
          id: { not: version.id },
          status: { in: ["PUBLISHED", "SCHEDULED"] as any },
        },
        data: { status: "ARCHIVED" as any, scheduledFor: null },
      }),
      prisma.homepageVersion.update({
        where: { id: version.id },
        data: {
          status: "PUBLISHED" as any,
          publishedAt: new Date(),
          scheduledFor: null,
        },
      }),
    ]);

    const savedVersion = await prisma.homepageVersion.findUnique({ where: { id: version.id } });
    await revalidatePaths(res, homepageRevalidateTargets());

    return res.status(200).json({
      ok: true,
      version: savedVersion
        ? {
            ...savedVersion,
            snapshot: parseJsonField(savedVersion.snapshot, {}),
            previewUrl: buildHomepagePreviewUrl(savedVersion.previewToken)
          }
        : null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to publish homepage", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to publish homepage.",
    });
  }
}