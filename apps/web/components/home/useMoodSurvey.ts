import { useEffect, useState } from "react";
import type { HomepageView } from "../../lib/cms-types";

type MoodSource = Pick<
  HomepageView,
  | "moodOptions"
  | "moodUpdatedText"
  | "moodHeadline"
  | "moodBreakdown"
  | "surveyTitle"
  | "surveyButtonLabel"
  | "surveySuccessText"
  | "moodTotalVotes"
>;

export type MoodWidgetState = {
  moodOptions: HomepageView["moodOptions"];
  moodUpdatedText: string;
  moodHeadline: string;
  moodBreakdown: HomepageView["moodBreakdown"];
  surveyTitle: string;
  surveyButtonLabel: string;
  surveySuccessText: string;
  moodTotalVotes?: number;
  hasVoted: boolean;
};

export function createInitialMoodState(data: MoodSource): MoodWidgetState {
  return {
    moodOptions: data.moodOptions,
    moodUpdatedText: data.moodUpdatedText,
    moodHeadline: data.moodHeadline,
    moodBreakdown: data.moodBreakdown,
    surveyTitle: data.surveyTitle,
    surveyButtonLabel: data.surveyButtonLabel,
    surveySuccessText: data.surveySuccessText,
    moodTotalVotes: data.moodTotalVotes,
    hasVoted: false
  };
}

export function useMoodSurvey(data: MoodSource) {
  const [mood, setMood] = useState<MoodWidgetState>(() => createInitialMoodState(data));
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [submittingKey, setSubmittingKey] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMood() {
      try {
        const response = await fetch("/api/public/mood");
        const next = await response.json().catch(() => null);
        if (!response.ok || !next || cancelled) return;

        setMood((current) => ({
          ...current,
          ...next
        }));
      } catch {
        // Keep the statically rendered state when the live survey API is unavailable.
      }
    }

    loadMood();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitVote(optionKey: string) {
    setSubmittingKey(optionKey);
    setFeedback("");
    setError("");

    try {
      const response = await fetch("/api/public/mood/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionKey })
      });

      const next = await response.json().catch(() => null);
      setSubmittingKey("");

      if (next?.moodBreakdown) {
        setMood((current) => ({
          ...current,
          ...next
        }));
        setSurveyOpen(false);
      }

      if (response.ok) {
        setFeedback(next?.surveySuccessText || mood.surveySuccessText);
        return;
      }

      if (response.status === 409) {
        setFeedback(next?.error || "You have already voted in today's survey.");
        return;
      }

      setError(next?.error || "Unable to record your response right now.");
    } catch {
      setSubmittingKey("");
      setError("Unable to record your response right now.");
    }
  }

  return {
    mood,
    surveyOpen,
    setSurveyOpen,
    submittingKey,
    feedback,
    error,
    submitVote,
    clearMessages: () => {
      setFeedback("");
      setError("");
    }
  };
}
