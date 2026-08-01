type MoodSummaryData = {
  moodHeadline: string;
  moodUpdatedText: string;
  moodBreakdown: Array<{
    key: string;
    label: string;
    value: string;
  }>;
};

export function MoodSummaryPanel({
  mood,
  variant
}: {
  mood: MoodSummaryData;
  variant: "heroCompact" | "leadFeature";
}) {
  if (variant === "heroCompact") {
    return (
      <section className="min-w-0 rounded-[1.6rem] border border-black/10 bg-white/58 px-3 py-3 text-[#1f2733] shadow-[0_20px_60px_rgba(32,39,51,0.08)] backdrop-blur-sm sm:px-4 sm:py-4">
        <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2e3745]">
          London&apos;s mood right now
        </p>
        <p className="mt-1.5 ln-ui text-[10px] uppercase tracking-[0.14em] text-[#677282] sm:text-[10.5px]">
          {mood.moodUpdatedText}
        </p>
        <h2 className="mt-3 font-sans text-[1.8rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#1f2733] sm:text-[2.2rem] lg:text-[2.6rem]">
          {mood.moodHeadline}
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {mood.moodBreakdown.map((item) => (
            <div key={item.key} className="min-w-0">
              <div className="ln-ui text-[1.65rem] font-light leading-none tracking-[-0.04em] text-[#1f2733] sm:text-[1.9rem] lg:text-[2.1rem]">
                {item.value}
              </div>
              <div className="mt-1 ln-ui text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4f5968] sm:text-[9.5px]">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-xl">
      <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-white/76">
        London&apos;s mood right now
      </p>
      <p className="mt-3 ln-ui text-[11px] uppercase tracking-[0.18em] text-white/48">
        {mood.moodUpdatedText}
      </p>
      <h2 className="mt-5 max-w-2xl font-sans text-[2.25rem] font-semibold leading-[0.96] tracking-[-0.03em] text-white sm:text-[3rem] lg:text-[4.35rem]">
        {mood.moodHeadline}
      </h2>
      <div className="mt-6 flex flex-wrap gap-6">
        {mood.moodBreakdown.map((item) => (
          <div key={item.key}>
            <div className="ln-ui text-[2rem] font-light leading-none tracking-[-0.03em] text-white sm:text-[2.35rem]">
              {item.value}
            </div>
            <div className="mt-1 ln-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
