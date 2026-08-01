import type { ClassifiedCardView, ClassifiedDetailView, ClassifiedItem } from "../../cms-types";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { logEvent } from "../../server/logger";

function buildPublicClassifiedWhere() {
  return {
    status: "APPROVED",
    publishedAt: { not: null },
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
  } satisfies Prisma.ClassifiedListingWhereInput;
}

function mapDbCard(listing: any): ClassifiedCardView {
  return {
    slug: listing.slug,
    category: listing.category,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    summary: listing.summary,
    image: listing.image || undefined,
    postedAt: (listing.publishedAt || listing.createdAt || new Date()).toISOString(),
    featured: Boolean(listing.featured)
  };
}

function mapDbDetail(listing: any): ClassifiedDetailView {
  return {
    ...mapDbCard(listing),
    description: String(listing.description || "")
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean),
    sellerName: listing.sellerName,
    sellerEmail: listing.sellerEmail,
    sellerPhone: listing.sellerPhone || undefined,
    expiresAt: listing.expiresAt?.toISOString() || null
  };
}

export async function getPublicClassifiedListings(limit?: number): Promise<ClassifiedCardView[]> {
  try {
    const rows = await prisma.classifiedListing.findMany({
      where: buildPublicClassifiedWhere(),
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit
    });
    return rows.map(mapDbCard);
  } catch (error) {
    logEvent("error", "classifieds.list_failed", { error, limit });
    throw error;
  }
}

export async function getFeaturedPublicClassifiedListings(limit = 2): Promise<ClassifiedCardView[]> {
  const listings = await getPublicClassifiedListings();
  const featured = listings.filter((listing) => listing.featured);
  return (featured.length > 0 ? featured : listings).slice(0, limit);
}

export async function listPublicClassifiedSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.classifiedListing.findMany({
      where: buildPublicClassifiedWhere(),
      select: { slug: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }]
    });

    return rows.map((row) => row.slug);
  } catch (error) {
    logEvent("error", "classifieds.list_slugs_failed", { error });
    throw error;
  }
}

export async function getPublicClassifiedListingBySlug(slug: string): Promise<ClassifiedDetailView | null> {
  try {
    const listing = await prisma.classifiedListing.findFirst({
      where: {
        slug,
        ...buildPublicClassifiedWhere()
      }
    });

    if (!listing) return null;

    return mapDbDetail(listing);
  } catch (error) {
    logEvent("error", "classifieds.detail_failed", { slug, error });
    throw error;
  }
}

export async function getRelatedPublicClassifiedListings(
  slug: string,
  category: string,
  limit = 3
): Promise<ClassifiedCardView[]> {
  const listings = await getPublicClassifiedListings();
  return listings.filter((listing) => listing.slug !== slug && listing.category === category).slice(0, limit);
}

export async function getHomepageClassifiedItems(limit = 4): Promise<ClassifiedItem[]> {
  const rows = await prisma.classifiedListing.findMany({
    where: buildPublicClassifiedWhere(),
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  return rows.map((row) => ({
    category: row.category,
    title: row.title,
    href: `/classifieds/${row.slug}`
  }));
}
