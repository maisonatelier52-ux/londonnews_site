// apps/web/components/home/SocialShareRail.tsx
import { useState } from "react";

type ShareIcon = "IG" | "X" | "LN" | "TG" | "FB";

const icons: ShareIcon[] = ["IG", "X", "LN", "TG", "FB"];

function buildShareUrl(icon: ShareIcon, url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  // Title + link on its own line, so platforms that respect the raw text
  // (X, Telegram) render it exactly like a manual share: title, then link below.
  const encodedTextWithUrl = encodeURIComponent(`${title}\n${url}`);

  switch (icon) {
    case "X":
      return `https://twitter.com/intent/tweet?text=${encodedTextWithUrl}`;
    case "TG":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`;
    case "FB":
      // Facebook's sharer only accepts a URL — the title/description is pulled
      // from the page's own Open Graph tags, not from query params.
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "LN":
      // LinkedIn's share-offsite endpoint works the same way — URL only,
      // title/description come from the page's Open Graph tags.
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "IG":
    default:
      return null;
  }
}

export function SocialShareRail({
  light = false,
  url,
  title,
}: {
  light?: boolean;
  url?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const resolveShareUrl = () => {
    if (typeof window === "undefined") {
      return url || "";
    }
    if (!url) {
      // No explicit URL was provided — fall back to the current page.
      return window.location.href;
    }
    // `url` may be an absolute link (https://...) or a relative path
    // (e.g. "/articles/some-story") coming from a Story/StoryCardData
    // object. Resolve relative paths against the current origin so the
    // share link always points at that specific story, not the page
    // the card happens to be rendered on.
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  };

  const handleShare = async (icon: ShareIcon) => {
    const shareUrl = resolveShareUrl();
    const shareTitle = title || (typeof document !== "undefined" ? document.title : "");

    if (icon === "IG") {
      // Instagram has no public web endpoint for sharing an arbitrary link,
      // so the standard fallback is to copy the link for the user to paste in-app.
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable (e.g. insecure context) — no-op.
      }
      return;
    }

    const target = buildShareUrl(icon, shareUrl, shareTitle);
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer,width=600,height=640");
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.24em] ${light ? "text-white/80" : "text-zinc-500"}`}>
      {icons.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => handleShare(icon)}
          className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
            light
              ? "border-white/25 bg-white/5 hover:border-white/60 hover:text-white"
              : "border-zinc-300 bg-white hover:border-zinc-950 hover:text-zinc-950"
          }`}
          aria-label={icon === "IG" ? "Copy link to share on Instagram" : `Share to ${icon}`}
          title={icon === "IG" && copied ? "Link copied" : undefined}
        >
          {icon === "IG" && copied ? "✓" : icon}
        </button>
      ))}
    </div>
  );
}