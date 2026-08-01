import type { NextApiRequest, NextApiResponse } from "next";
import {
  getMissingHostedEnv,
  getMissingRuntimeEnv,
  isHostedRuntime
} from "../../lib/security/env";
import { requireMethod, setNoStore } from "../../lib/server/api";
import { prisma } from "../../utils/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["GET"])) return;

  const missingRuntimeEnv = getMissingRuntimeEnv();
  const missingHostedEnv = isHostedRuntime() ? getMissingHostedEnv() : [];

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (error) {
    return res.status(503).json({
      ok: false,
      database: "unreachable",
      missingRuntimeEnv,
      missingHostedEnv,
      error: error instanceof Error ? error.message : "Database check failed"
    });
  }

  if (missingRuntimeEnv.length > 0 || missingHostedEnv.length > 0) {
    return res.status(503).json({
      ok: false,
      database: "ready",
      missingRuntimeEnv,
      missingHostedEnv
    });
  }

  return res.status(200).json({
    ok: true,
    database: "ready",
    missingRuntimeEnv: [],
    missingHostedEnv: []
  });
}
