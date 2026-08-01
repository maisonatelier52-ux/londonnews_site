import type { BodyBlock } from "../cms-types";
import { prisma } from "../../utils/prisma";

type SnapshotInput = {
  title: string;
  sectionId?: string | null;
  dek?: string | null;
  excerpt?: string | null;
  heroImage?: string | null;
  heroAlt?: string | null;
  content: string;
  contentBlocks: BodyBlock[];
  status: string;
  previewToken?: string | null;
  publishedAt?: Date | null;
  scheduledPublishAt?: Date | null;
  scheduledUnpublishAt?: Date | null;
  seo?: {
    slug?: string | null;
    metaTitle?: string | null;
    metaDesc?: string | null;
    canonical?: string | null;
    socialTitle?: string | null;
    socialDescription?: string | null;
    socialImage?: string | null;
    noindex?: boolean | null;
  } | null;
};

export async function recordArticleRevision(params: {
  articleId: string;
  createdById?: string | null;
  action: string;
  note?: string | null;
  snapshot: SnapshotInput;
}) {
  return prisma.articleRevision.create({
    data: {
      articleId: params.articleId,
      createdById: params.createdById || null,
      action: params.action,
      note: params.note || null,
      snapshot: JSON.stringify(params.snapshot)
    }
  });
}
