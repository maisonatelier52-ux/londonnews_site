import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { CommunityServiceBlock } from "../../../components/home/CommunityServiceBlock";
import { EditorialFeatureBand, mapHeadlineToSideStory } from "../../../components/home/EditorialFeatureBand";
import { FooterMark } from "../../../components/home/FooterMark";
import { HomeLeadFeature } from "../../../components/home/HomeLeadFeature";
import { ImmersiveFeaturePanel } from "../../../components/home/ImmersiveFeaturePanel";
import { MastheadHero } from "../../../components/home/MastheadHero";
import { MoodSurveyStrip } from "../../../components/home/MoodSurveyStrip";
import { TopNav } from "../../../components/home/TopNav";
import { useMoodSurvey } from "../../../components/home/useMoodSurvey";
import { SeoHead } from "../../../components/seo/SeoHead";
import { getHomepagePreviewByToken } from "../../../lib/cms/queries/homepage-preview";
import { buildSeo } from "../../../lib/seo";
import { setNoStore } from "../../../lib/server/api";

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  setNoStore(res);
  const token = params?.token as string;
  const data = await getHomepagePreviewByToken(token);

  if (!data) {
    return { notFound: true };
  }

  return {
    props: {
      homepage: data.homepage,
      version: JSON.parse(JSON.stringify(data.version)),
    },
  };
};

export default function HomepagePreviewPage({
  homepage,
  version,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const seo = buildSeo({
    title: `${homepage.seo?.title || "Homepage preview"} | Preview`,
    description: homepage.seo?.description || "Preview of a London News homepage draft.",
    image: homepage.seo?.image,
    canonical: version.previewUrl,
    type: "website",
    noindex: true,
  });
  const { mood, surveyOpen, setSurveyOpen, submittingKey, feedback, error, submitVote, clearMessages } =
    useMoodSurvey(homepage);
  const immersiveStories = homepage.supportingStories.slice(0, 2);
  const editorialSideStories = [
    homepage.supportingStories[2]
      ? {
          id: homepage.supportingStories[2].id,
          label: homepage.supportingStories[2].section,
          title: homepage.supportingStories[2].title,
          summary: homepage.supportingStories[2].excerpt,
          href: homepage.supportingStories[2].href
        }
      : null,
    ...homepage.topHeadlines.slice(0, 2).map((item: any, index: number) =>
      mapHeadlineToSideStory(item, index === 0 ? "Briefing" : "Watch")
    )
  ].filter(Boolean);
  const lowerFeatureStories = homepage.tertiaryStories.slice(0, 2);

  return (
    <>
      <SeoHead {...seo} />

      <div id="top" className="min-h-screen bg-[#f1ece4] text-zinc-950">
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">
          Homepage preview • {version.label || version.status} • not indexed
        </div>

        <TopNav data={homepage} />
        <MastheadHero
          data={homepage}
          mood={mood}
        />

        <main>
          <HomeLeadFeature
            story={homepage.leadStory}
            sectionTitle={homepage.goodNewsTitle}
            sliderStories={homepage.goodNewsStories.slice(1)}
          />

          {immersiveStories.length ? (
            <section className="grid gap-px bg-black/10 lg:grid-cols-2">
              {immersiveStories.map((story: any) => (
                <ImmersiveFeaturePanel
                  key={story.id}
                  story={story}
                  minHeight="min-h-[520px] lg:min-h-[760px]"
                />
              ))}
            </section>
          ) : null}

          <EditorialFeatureBand lead={homepage.secondFeature} sideStories={editorialSideStories as any} />

          {lowerFeatureStories.length ? (
            <section className="grid gap-px bg-black/10 lg:grid-cols-2">
              {lowerFeatureStories.map((story: any) => (
                <ImmersiveFeaturePanel
                  key={story.id}
                  story={story}
                  muted
                  minHeight="min-h-[500px] lg:min-h-[700px]"
                />
              ))}
            </section>
          ) : null}

          <MoodSurveyStrip
            mood={mood}
            surveyOpen={surveyOpen}
            setSurveyOpen={setSurveyOpen}
            submittingKey={submittingKey}
            feedback={feedback}
            error={error}
            submitVote={submitVote}
            clearMessages={clearMessages}
          />

          <CommunityServiceBlock data={homepage} />
        </main>

        <FooterMark data={homepage} />
      </div>
    </>
  );
}
