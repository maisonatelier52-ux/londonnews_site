import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { slugify, withNumericSuffix } from "../../utils/slug";

const futureDateString = z
  .string()
  .optional()
  .transform((value) => (value ? value.trim() : ""))
  .refine((value) => !value || !Number.isNaN(new Date(value).valueOf()), {
    message: "Please provide a valid expiry date."
  });

export const classifiedSubmissionSchema = z.object({
  category: z.string().min(2),
  title: z.string().min(6),
  price: z.string().min(1),
  location: z.string().min(2),
  summary: z.string().min(20).max(220),
  description: z.string().min(40),
  sellerName: z.string().min(2).max(120),
  sellerEmail: z.string().email(),
  sellerPhone: z.string().optional().default(""),
  image: z.string().url().optional().or(z.literal("")).default(""),
  expiresAt: futureDateString
});

export const classifiedAdminSchema = classifiedSubmissionSchema.extend({
  slug: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
  reviewNotes: z.string().optional().default(""),
  action: z.enum(["draft", "submit", "publish", "reject"]).default("draft")
});

export type ClassifiedSubmissionInput = z.infer<typeof classifiedSubmissionSchema>;
export type ClassifiedAdminInput = z.infer<typeof classifiedAdminSchema>;
export type ClassifiedSaveAction = ClassifiedAdminInput["action"];

export async function uniqueClassifiedSlug(input: string, currentId?: string) {
  const base = slugify(input) || `classified-${Date.now()}`;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = withNumericSuffix(base, attempt);
    const existing = await prisma.classifiedListing.findUnique({
      where: { slug: candidate }
    });
    if (!existing || existing.id === currentId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function toStoredClassifiedDescription(input: string) {
  return input
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function resolveClassifiedState(action: ClassifiedSaveAction, current?: {
  submittedAt?: Date | null;
  publishedAt?: Date | null;
}) {
  if (action === "publish") {
    return {
      status: "APPROVED",
      submittedAt: current?.submittedAt || new Date(),
      publishedAt: current?.publishedAt || new Date()
    };
  }

  if (action === "submit") {
    return {
      status: "IN_REVIEW",
      submittedAt: new Date(),
      publishedAt: null
    };
  }

  if (action === "reject") {
    return {
      status: "REJECTED",
      submittedAt: current?.submittedAt || new Date(),
      publishedAt: null
    };
  }

  return {
    status: "DRAFT",
    submittedAt: current?.submittedAt || null,
    publishedAt: null
  };
}
