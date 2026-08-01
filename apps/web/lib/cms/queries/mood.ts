import { prisma } from "../../../utils/prisma";
import { parseJsonField } from "../../../utils/json";
import type { MoodItem, MoodOption } from "../../cms-types";
import {
  computeMoodBreakdown,
  formatMoodUpdatedText,
  getMoodSurveyDay,
  normalizeMoodBreakdown,
  normalizeMoodOptions
} from "../../mood";
import { defaultHomepageSettings } from "../utils";
import { logEvent } from "../../server/logger";

export type MoodWidgetView = {
  moodOptions: MoodOption[];
  moodUpdatedText: string;
  moodHeadline: string;
  moodBreakdown: MoodItem[];
  surveyTitle: string;
  surveyButtonLabel: string;
  surveySuccessText: string;
  moodTotalVotes: number;
  hasVoted: boolean;
};

function mergeMoodSettings(input: unknown) {
  return {
    ...defaultHomepageSettings(),
    ...parseJsonField(input, {})
  };
}

export async function buildMoodWidgetView(params: {
  homepageId?: string | null;
  settings?: unknown;
  visitorId?: string | null;
  surveyDay?: string;
}): Promise<MoodWidgetView> {
  const settings = mergeMoodSettings(params.settings);
  const moodOptions = normalizeMoodOptions(settings.moodOptions, settings.moodBreakdown);
  const fallbackBreakdown = normalizeMoodBreakdown(settings.moodBreakdown, moodOptions);

  if (!params.homepageId) {
    return {
      moodOptions,
      moodUpdatedText: settings.moodUpdatedText,
      moodHeadline: settings.moodHeadline,
      moodBreakdown: fallbackBreakdown,
      surveyTitle: settings.surveyTitle,
      surveyButtonLabel: settings.surveyButtonLabel,
      surveySuccessText: settings.surveySuccessText,
      moodTotalVotes: 0,
      hasVoted: false
    };
  }

  const surveyDay = params.surveyDay || getMoodSurveyDay();
  const [votes, existingVote] = await Promise.all([
    prisma.moodSurveyVote.findMany({
      where: {
        homepageId: params.homepageId,
        surveyDay
      },
      select: {
        optionKey: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    params.visitorId
      ? prisma.moodSurveyVote.findFirst({
          where: {
            homepageId: params.homepageId,
            visitorId: params.visitorId,
            surveyDay
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  const counts = moodOptions.reduce<Record<string, number>>((acc, option) => {
    acc[option.key] = 0;
    return acc;
  }, {});

  for (const vote of votes) {
    if (Object.prototype.hasOwnProperty.call(counts, vote.optionKey)) {
      counts[vote.optionKey] += 1;
    }
  }

  const computed = computeMoodBreakdown(moodOptions, counts, fallbackBreakdown);

  return {
    moodOptions,
    moodUpdatedText: formatMoodUpdatedText(votes[0]?.createdAt, settings.moodUpdatedText),
    moodHeadline: settings.moodHeadline,
    moodBreakdown: computed.breakdown,
    surveyTitle: settings.surveyTitle,
    surveyButtonLabel: settings.surveyButtonLabel,
    surveySuccessText: settings.surveySuccessText,
    moodTotalVotes: computed.totalVotes,
    hasVoted: Boolean(existingVote)
  };
}

export async function getActiveMoodWidgetView(visitorId?: string | null) {
  try {
    const homepage = await prisma.homepage.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        settings: true
      }
    });

    if (!homepage) {
      return null;
    }

    return buildMoodWidgetView({
      homepageId: homepage.id,
      settings: homepage.settings,
      visitorId
    });
  } catch (error) {
    logEvent("error", "mood.query_failed", { error });
    throw error;
  }
}
