// apps/web/components/editorial/StoryGrid.tsx
import { StoryCardData } from "../../lib/editorial-data";
import { StoryCard } from "../home/StoryCard";

export function StoryGrid({
  stories,
  columns = 2,
  dark = false,
}: {
  stories: StoryCardData[];
  columns?: 2 | 3;
  /** Pass true when this grid sits on a dark panel (e.g. related stories on the article page). */
  dark?: boolean;
}) {
  return (
    <section
      className={
        columns === 3
          ? "grid gap-6 lg:grid-cols-3"
          : "grid gap-6 lg:grid-cols-2"
      }
    >
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} dark={dark} />
      ))}
    </section>
  );
}