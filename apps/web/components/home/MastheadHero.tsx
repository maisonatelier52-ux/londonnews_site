// components/home/MastheadHero.tsx

import type { HomepageView } from "../../lib/cms-types";
import { Container } from "./Container";
import { LondonNewsLogo } from "./LondonNewsLogo";
import { MoodSummaryPanel } from "./MoodSummaryPanel";
import { WeatherMoodPanel } from "./WeatherMoodPanel";

export function MastheadHero({
  data,
  mood
}: {
  data: HomepageView;
  mood: {
    moodHeadline: string;
    moodUpdatedText: string;
    moodBreakdown: HomepageView["moodBreakdown"];
  };
}) {
  return (
    <section className="ln-hero-surface border-b border-black/5">
      <Container className="pb-16 pt-10 sm:pb-20 lg:pb-28 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="lg:pr-6">
            <p className="ln-ui mb-6 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[#455468]">
              {data.mastheadLine}
            </p>
            <LondonNewsLogo
              imageClassName="text-[3.85rem] sm:text-[5rem] lg:text-[7.1rem]"
              ariaLabel="London News home"
            />
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-start gap-3 sm:gap-5 lg:gap-6">
            <WeatherMoodPanel data={data} />
            <MoodSummaryPanel mood={mood} variant="heroCompact" />
          </div>
        </div>
      </Container>
    </section>
  );
}
// import type { HomepageView } from "../../lib/cms-types";
// import { Container } from "./Container";
// import { LondonNewsLogo } from "./LondonNewsLogo";
// import { MoodSummaryPanel } from "./MoodSummaryPanel";
// import { WeatherMoodPanel } from "./WeatherMoodPanel";

// export function MastheadHero({
//   data,
//   mood
// }: {
//   data: HomepageView;
//   mood: {
//     moodHeadline: string;
//     moodUpdatedText: string;
//     moodBreakdown: HomepageView["moodBreakdown"];
//   };
// }) {
//   return (
//     <section className="ln-hero-surface border-b border-black/5">
//       <Container className="pt-8 lg:pt-10">
//         <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
//           <div className="pt-6 lg:pt-24">
//             <p className="ln-ui mb-5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-[#455468]">
//               {data.mastheadLine}
//             </p>
//             <LondonNewsLogo
//               imageClassName="text-[3.85rem] sm:text-[5rem] lg:text-[7.1rem]"
//               ariaLabel="London News home"
//             />
//           </div>

//           <div className="grid min-w-0 grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-start gap-3 sm:gap-5 lg:gap-6">
//             <WeatherMoodPanel data={data} />
//             <MoodSummaryPanel mood={mood} variant="heroCompact" />
//           </div>
//         </div>
//       </Container>
//     </section>
//   );
// }
