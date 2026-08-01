import Head from "next/head";

export function SeoHead({
  title,
  description,
  image,
  canonical,
  type = "website",
  noindex = false,
  socialTitle,
  socialDescription,
  publishedTime,
  modifiedTime,
  authorName,
  section,
  keywords = [],
  siteName = "London News",
  locale = "en_GB",
  twitterSite,
}: {
  title: string;
  description: string;
  image?: string;
  canonical: string;
  type?: "website" | "article";
  noindex?: boolean;
  socialTitle?: string;
  socialDescription?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  keywords?: string[];
  siteName?: string;
  locale?: string;
  twitterSite?: string;
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          noindex
            ? "noindex,nofollow"
            : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        }
      />
      <meta
        name="googlebot"
        content={
          noindex
            ? "noindex,nofollow"
            : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        }
      />
      <link rel="canonical" href={canonical} />
      {authorName ? <meta name="author" content={authorName} /> : null}
      {keywords.length ? <meta name="keywords" content={keywords.join(", ")} /> : null}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={socialTitle || title} />
      <meta property="og:description" content={socialDescription || description} />
      <meta property="og:url" content={canonical} />
      {image ? <meta property="og:image" content={image} /> : null}
      {image ? <meta property="og:image:alt" content={socialTitle || title} /> : null}
      {type === "article" && publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {type === "article" && modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}
      {type === "article" && authorName ? <meta property="article:author" content={authorName} /> : null}
      {type === "article" && section ? <meta property="article:section" content={section} /> : null}
      {type === "article"
        ? keywords.map((keyword) => <meta key={keyword} property="article:tag" content={keyword} />)
        : null}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}
      <meta name="twitter:title" content={socialTitle || title} />
      <meta name="twitter:description" content={socialDescription || description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </Head>
  );
}
