import type { MoodWidgetState } from "./useMoodSurvey";

export function MoodSurveyStrip({
  mood,
  surveyOpen,
  setSurveyOpen,
  submittingKey,
  feedback,
  error,
  submitVote,
  clearMessages
}: {
  mood: MoodWidgetState;
  surveyOpen: boolean;
  setSurveyOpen: (open: boolean) => void;
  submittingKey: string;
  feedback: string;
  error: string;
  submitVote: (optionKey: string) => Promise<void>;
  clearMessages: () => void;
}) {
  return (
    <section className="bg-black py-8 text-white lg:py-10">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
        <div>
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Updated just now</p>
          <h2 className="mt-3 font-sans text-[2.15rem] font-semibold leading-[1] tracking-[-0.03em] text-white sm:text-[3.25rem]">
            {mood.moodHeadline}
          </h2>
          <div className="mt-5 flex flex-wrap gap-8">
            {mood.moodBreakdown.map((item) => (
              <div key={item.key}>
                <div className="ln-ui text-[2rem] font-light leading-none tracking-[-0.03em] text-white sm:text-[2.35rem]">
                  {item.value}
                </div>
                <div className="mt-1 ln-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-white/64">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          {(feedback || error) && !surveyOpen ? (
            <p className={`mt-4 text-sm leading-7 ${error ? "text-rose-300" : "text-emerald-300"}`}>
              {error || feedback}
            </p>
          ) : null}
        </div>

        <div className="border border-white/12 bg-[#0f1117] px-5 py-5 lg:min-w-[320px]">
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-white/56">
            London&apos;s mood right now
          </p>

          {mood.hasVoted ? (
            <p className="mt-4 text-sm leading-7 text-emerald-300">{feedback || mood.surveySuccessText}</p>
          ) : surveyOpen ? (
            <div className="mt-4 space-y-3">
              {mood.moodOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => submitVote(option.key)}
                  disabled={Boolean(submittingKey)}
                  className="block w-full bg-[var(--accent)] px-5 py-4 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#ebbb32] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingKey === option.key ? "Saving..." : option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSurveyOpen(false);
                  clearMessages();
                }}
                className="ln-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56"
              >
                Close survey
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setSurveyOpen(true);
                }}
                className="mt-4 block w-full bg-[var(--accent)] px-5 py-4 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#ebbb32]"
              >
                {mood.surveyTitle}
              </button>
              <p className="mt-3 text-xs leading-6 text-white/54">
                {typeof mood.moodTotalVotes === "number" ? `${mood.moodTotalVotes} responses so far today.` : mood.surveySuccessText}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
