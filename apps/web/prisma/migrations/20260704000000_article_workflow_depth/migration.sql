ALTER TABLE "Article"
ADD COLUMN "previewToken" TEXT,
ADD COLUMN "scheduledPublishAt" TIMESTAMP(3),
ADD COLUMN "scheduledUnpublishAt" TIMESTAMP(3);

UPDATE "Article"
SET "previewToken" = md5("id" || clock_timestamp()::text || random()::text)
WHERE "previewToken" IS NULL;

ALTER TABLE "Article"
ALTER COLUMN "previewToken" SET NOT NULL;

CREATE UNIQUE INDEX "Article_previewToken_key" ON "Article"("previewToken");
CREATE INDEX "Article_scheduledPublishAt_idx" ON "Article"("scheduledPublishAt");
CREATE INDEX "Article_scheduledUnpublishAt_idx" ON "Article"("scheduledUnpublishAt");

CREATE TABLE "ArticleCorrection" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "createdById" TEXT,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArticleCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArticleCorrection_articleId_createdAt_idx" ON "ArticleCorrection"("articleId", "createdAt");
CREATE INDEX "ArticleCorrection_createdById_createdAt_idx" ON "ArticleCorrection"("createdById", "createdAt");

ALTER TABLE "ArticleCorrection"
ADD CONSTRAINT "ArticleCorrection_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleCorrection"
ADD CONSTRAINT "ArticleCorrection_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
