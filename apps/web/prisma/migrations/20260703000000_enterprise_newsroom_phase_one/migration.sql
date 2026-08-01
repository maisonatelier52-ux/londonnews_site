ALTER TABLE "Article"
ADD COLUMN "contentBlocks" TEXT;

CREATE TABLE "ArticleRevision" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "createdById" TEXT,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "snapshot" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ArticleRevision"
ADD CONSTRAINT "ArticleRevision_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleRevision"
ADD CONSTRAINT "ArticleRevision_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ArticleRevision_articleId_createdAt_idx"
ON "ArticleRevision"("articleId", "createdAt");

CREATE INDEX "ArticleRevision_createdById_createdAt_idx"
ON "ArticleRevision"("createdById", "createdAt");

CREATE TABLE "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "source" TEXT NOT NULL DEFAULT 'public',
  "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key"
ON "NewsletterSubscriber"("email");

CREATE INDEX "NewsletterSubscriber_status_createdAt_idx"
ON "NewsletterSubscriber"("status", "createdAt");

CREATE TABLE "ContactMessage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_status_createdAt_idx"
ON "ContactMessage"("status", "createdAt");

CREATE TABLE "ClassifiedEnquiry" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClassifiedEnquiry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClassifiedEnquiry"
ADD CONSTRAINT "ClassifiedEnquiry_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "ClassifiedListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ClassifiedEnquiry_listingId_createdAt_idx"
ON "ClassifiedEnquiry"("listingId", "createdAt");

CREATE INDEX "ClassifiedEnquiry_status_createdAt_idx"
ON "ClassifiedEnquiry"("status", "createdAt");
