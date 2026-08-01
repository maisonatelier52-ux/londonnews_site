import type { NextApiRequest, NextApiResponse } from "next";
import { getTopNavCategories, getVisibleCategories, getVisibleCategoryTree } from "../../../lib/categories/queries";
import { requireMethod, setPublicApiCache } from "../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const mode = String(req.query.mode || "all");
    const data =
      mode === "nav"
        ? await getTopNavCategories()
        : mode === "tree"
        ? await getVisibleCategoryTree()
          : await getVisibleCategories();
    setPublicApiCache(res, { sMaxAge: 300, staleWhileRevalidate: 1800 });
    return res.status(200).json(data);
  } catch {
    return res.status(503).json({ error: "Unable to load categories." });
  }
}
