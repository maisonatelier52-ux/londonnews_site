import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { CommunityServiceBlock } from "../components/home/CommunityServiceBlock";
import { EditorialFeatureBand, mapHeadlineToSideStory } from "../components/home/EditorialFeatureBand";
import { FooterMark } from "../components/home/FooterMark";
import { HomeLeadFeature } from "../components/home/HomeLeadFeature";
import { HomeSplash } from "../components/home/HomeSplash";
import { ImmersiveFeaturePanel } from "../components/home/ImmersiveFeaturePanel";
import { MastheadHero } from "../components/home/MastheadHero";
import { MoodSurveyStrip } from "../components/home/MoodSurveyStrip";
import { TopNav } from "../components/home/TopNav";
import { useMoodSurvey } from "../components/home/useMoodSurvey";
import { SeoHead } from "../components/seo/SeoHead";
import { StructuredData } from "../components/seo/StructuredData";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { buildSeo, buildWebsiteStructuredData } from "../lib/seo";

export const getStaticProps: GetStaticProps = async () => {
  const homepage = await getActiveHomepageData();

  if (!homepage) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        homepage,
      })
    ),
    revalidate: 60,
  };
};

export default function HomePage({
  homepage,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const seo = buildSeo({
    title: homepage.seo?.title,
    description: homepage.seo?.description,
    image: homepage.seo?.image,
    canonical: absoluteUrl("/"),
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
      <StructuredData
        id="homepage-structured-data"
        data={buildWebsiteStructuredData({
          description: seo.description,
          image: seo.image
        })}
      />

      <div id="top" className="min-h-screen bg-[#f1ece4] text-zinc-950">
        <HomeSplash />
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
              {immersiveStories.map((story: any, index: number) => (
                <ImmersiveFeaturePanel
                  key={story.id}
                  story={story}
                  minHeight={index === 0 ? "min-h-[520px] lg:min-h-[760px]" : "min-h-[520px] lg:min-h-[760px]"}
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
