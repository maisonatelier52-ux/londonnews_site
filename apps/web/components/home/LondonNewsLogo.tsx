import Link from "next/link";

export function LondonNewsLogo({
  href = "/",
  ariaLabel = "London News home",
  imageClassName = "",
  panelClassName = ""
}: {
  href?: string;
  ariaLabel?: string;
  imageClassName?: string;
  panelClassName?: string;
}) {
  const wordmark = (
    <span
      aria-hidden="true"
      className={`inline-flex select-none flex-col leading-[0.82] text-[var(--accent)] ${imageClassName || "text-[2rem]"}`.trim()}
    >
      <span className="block font-news tracking-[-0.06em]">London</span>
      <span className="block pl-[0.34em] font-news tracking-[-0.06em]">News</span>
    </span>
  );

  const content = panelClassName ? (
    <span className={`inline-flex items-center justify-center ${panelClassName}`.trim()}>{wordmark}</span>
  ) : (
    wordmark
  );

  return (
    <Link href={href} aria-label={ariaLabel} className="inline-flex shrink-0 no-underline">
      {content}
    </Link>
  );
}
