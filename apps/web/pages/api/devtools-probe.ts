import type { NextApiRequest, NextApiResponse } from "next";

// Chrome DevTools automatically requests this path from any site opened
// while DevTools is open (a project-config discovery probe). There's nothing
// to configure here, so just answer with an empty, successful response
// instead of letting it fall through to a 404.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({});
}