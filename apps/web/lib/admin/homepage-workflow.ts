import crypto from "node:crypto";
import { prisma } from "../../utils/prisma";
import { parseJsonField, stringifyJsonField } from "../../utils/json";
import { absoluteUrl, defaultHomepageSettings } from "../cms/utils";

export type HomepageSnapshot = {
  title: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  settings?: any;
  sections: Array<{
    key: string;
    kind: string;
    title?: string | null;
    position: number;
    settings?: any;
    slots: Array<{
      position: number;
      articleId?: string | null;
      titleOverride?: string | null;
      excerptOverride?: string | null;
      imageOverride?: string | null;
      hrefOverride?: string | null;
      kickerOverride?: string | null;
      settings?: any;
    }>;
  }>;
};

export function generatePreviewToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function sanitizeHomepageSnapshot(input: any): HomepageSnapshot {
  const sections = Array.isArray(input?.sections) ? input.sections : [];

  return {
    title: String(input?.title || "Homepage"),
    slug: String(input?.slug || "homepage"),
    seoTitle: input?.seoTitle ?? null,
    seoDescription: input?.seoDescription ?? null,
    seoImage: input?.seoImage ?? null,
    settings: input?.settings || defaultHomepageSettings(),
    sections: sections.map((section: any, sectionIndex: number) => ({
      key: String(section?.key || `section-${sectionIndex + 1}`),
      kind: String(section?.kind || "CUSTOM"),
      title: section?.title ?? null,
      position: Number(section?.position || sectionIndex + 1),
      settings: section?.settings || {},
      slots: (Array.isArray(section?.slots) ? section.slots : []).map((slot: any, slotIndex: number) => ({
        position: Number(slot?.position || slotIndex + 1),
        articleId: slot?.articleId || slot?.article?.id || null,
        titleOverride: slot?.titleOverride ?? null,
        excerptOverride: slot?.excerptOverride ?? null,
        imageOverride: slot?.imageOverride ?? null,
        hrefOverride: slot?.hrefOverride ?? null,
        kickerOverride: slot?.kickerOverride ?? null,
        settings: slot?.settings || {},
      })),
    })),
  };
}

export async function createHomepageVersion(params: {
  homepageId: string;
  label?: string | null;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledFor?: Date | null;
  createdById?: string | null;
  snapshot: HomepageSnapshot;
}) {
  const previewToken = generatePreviewToken();
  return prisma.homepageVersion.create({
    data: {
      homepageId: params.homepageId,
      label: params.label || null,
      status: (params.status || "DRAFT") as any,
      scheduledFor: params.scheduledFor || null,
      createdById: params.createdById || null,
      snapshot: stringifyJsonField(params.snapshot),
      previewToken,
    },
  });
}

export async function applyHomepageSnapshot(params: {
  homepageId: string;
  snapshot: HomepageSnapshot;
  activate?: boolean;
}) {
  const { homepageId, snapshot, activate = true } = params;

  return prisma.$transaction(async (tx) => {
    if (activate) {
      await tx.homepage.updateMany({
        where: { NOT: { id: homepageId } },
        data: { isActive: false },
      });
    }

    await tx.homepage.update({
      where: { id: homepageId },
      data: {
        title: snapshot.title,
        slug: snapshot.slug,
        seoTitle: snapshot.seoTitle ?? null,
        seoDescription: snapshot.seoDescription ?? null,
        seoImage: snapshot.seoImage ?? null,
        settings: stringifyJsonField(snapshot.settings || defaultHomepageSettings()),
        ...(activate ? { isActive: true } : {}),
      },
    });

    await tx.homepageSection.deleteMany({
      where: { homepageId },
    });

    for (const section of snapshot.sections) {
      await tx.homepageSection.create({
        data: {
          homepageId,
          key: section.key,
          kind: section.kind as any,
          title: section.title || null,
          position: section.position,
          settings: stringifyJsonField(section.settings || {}),
          slots: {
            create: (section.slots || []).map((slot) => ({
              position: slot.position,
              articleId: slot.articleId || null,
              titleOverride: slot.titleOverride || null,
              excerptOverride: slot.excerptOverride || null,
              imageOverride: slot.imageOverride || null,
              hrefOverride: slot.hrefOverride || null,
              kickerOverride: slot.kickerOverride || null,
              settings: stringifyJsonField(slot.settings || {}),
            })),
          },
        },
      });
    }

    return tx.homepage.findUnique({
      where: { id: homepageId },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            slots: {
              orderBy: { position: "asc" },
              include: {
                article: {
                  include: {
                    seo: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    }).then((homepage) =>
      homepage
        ? {
            ...homepage,
            settings: parseJsonField(homepage.settings, defaultHomepageSettings()),
            sections: homepage.sections.map((section) => ({
              ...section,
              settings: parseJsonField(section.settings, {}),
              slots: section.slots.map((slot) => ({
                ...slot,
                settings: parseJsonField(slot.settings, {})
              }))
            }))
          }
        : null
    );
  });
}

export function buildHomepagePreviewUrl(token: string) {
  return absoluteUrl(`/preview/homepage/${token}`);
}
