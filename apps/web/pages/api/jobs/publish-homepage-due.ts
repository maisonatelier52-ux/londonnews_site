import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../utils/prisma";
import { parseJsonField } from "../../../utils/json";
import { applyHomepageSnapshot } from "../../../lib/admin/homepage-workflow";
import { homepageRevalidateTargets, revalidatePaths } from "../../../lib/server/revalidate";
import { logEvent } from "../../../lib/server/logger";
import { requireMethod, setNoStore } from "../../../lib/server/api";
import { getCronAuthSecret } from "../../../lib/security/env";

function readCronToken(req: NextApiRequest) {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length);
  }

  return req.headers["x-cron-token"] || req.query.token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  const token = readCronToken(req);
  const cronSecret = getCronAuthSecret();

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Cron auth secret is not configured." });
  }

  if (cronSecret && token !== cronSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const now = new Date();
  const dueVersions = await prisma.homepageVersion.findMany({
    where: {
      status: "SCHEDULED" as any,
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
  });

  let published = 0;

  for (const version of dueVersions) {
    await applyHomepageSnapshot({
      homepageId: version.homepageId,
      snapshot: parseJsonField(version.snapshot, { title: "Homepage", slug: "homepage", sections: [] }),
      activate: true,
    });

    await prisma.$transaction([
      prisma.homepageVersion.updateMany({
        where: {
          homepageId: version.homepageId,
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

    published++;
  }

  if (published > 0) {
    await revalidatePaths(res, homepageRevalidateTargets());
  }

  logEvent("info", "homepage.cron_publish_due_complete", { published });

  return res.status(200).json({ ok: true, published });
}
