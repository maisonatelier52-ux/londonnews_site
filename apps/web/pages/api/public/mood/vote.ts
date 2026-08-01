import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { buildMoodWidgetView } from "../../../../lib/cms/queries/mood";
import {
  MOOD_VISITOR_COOKIE,
  getMoodSurveyDay,
  normalizeMoodOptions,
  readNamedCookie,
  serializeCookie
} from "../../../../lib/mood";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import { defaultHomepageSettings } from "../../../../lib/cms/utils";
import { parseJsonField } from "../../../../utils/json";
import { prisma } from "../../../../utils/prisma";

const voteSchema = z.object({
  optionKey: z.string().min(1).max(64)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const ok = await applyRouteRateLimit(req, res, {
    keyPrefix: "mood-vote",
    max: 8,
    windowMs: 60 * 60 * 1000
  }, "Too many mood survey attempts from this connection. Please try again later.");
  if (!ok) return;

  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Choose a survey option first." });
  }

  try {
    const homepage = await prisma.homepage.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        settings: true
      }
    });

    if (!homepage) {
      return res.status(404).json({ error: "No active homepage is configured." });
    }

    const settings = {
      ...defaultHomepageSettings(),
      ...parseJsonField(homepage.settings, {})
    };
    const moodOptions = normalizeMoodOptions(settings.moodOptions, settings.moodBreakdown);
    const selectedOption = moodOptions.find((option) => option.key === parsed.data.optionKey);

    if (!selectedOption) {
      return res.status(400).json({ error: "That survey option is no longer available." });
    }

    const surveyDay = getMoodSurveyDay();
    const existingVisitorId = readNamedCookie(req.headers.cookie, MOOD_VISITOR_COOKIE);
    const visitorId = existingVisitorId || crypto.randomUUID();

    try {
      await prisma.moodSurveyVote.create({
        data: {
          homepageId: homepage.id,
          visitorId,
          surveyDay,
          optionKey: selectedOption.key,
          optionLabel: selectedOption.label
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const current = await buildMoodWidgetView({
          homepageId: homepage.id,
          settings,
          visitorId,
          surveyDay
        });

        if (!existingVisitorId) {
          res.setHeader("Set-Cookie", serializeCookie(MOOD_VISITOR_COOKIE, visitorId, 60 * 60 * 24 * 365));
        }

        return res.status(409).json({
          error: "You have already voted in today's mood survey.",
          ...current
        });
      }

      throw error;
    }

    const current = await buildMoodWidgetView({
      homepageId: homepage.id,
      settings,
      visitorId,
      surveyDay
    });

    if (!existingVisitorId) {
      res.setHeader("Set-Cookie", serializeCookie(MOOD_VISITOR_COOKIE, visitorId, 60 * 60 * 24 * 365));
    }

    return res.status(201).json(current);
  } catch {
    return res.status(503).json({
      error: "Mood survey voting is temporarily unavailable."
    });
  }
}
