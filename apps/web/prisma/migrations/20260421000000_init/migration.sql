CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'GUEST_WRITER',
  "bio" TEXT,
  "avatar" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Section" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "navLabel" TEXT,
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "showInTopNav" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 999,
  "premium" BOOLEAN NOT NULL DEFAULT false,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoImage" TEXT,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Section_slug_key" ON "Section"("slug");
CREATE INDEX "Section_position_idx" ON "Section"("position");
CREATE INDEX "Section_isVisible_showInTopNav_position_idx" ON "Section"("isVisible", "showInTopNav", "position");

ALTER TABLE "Section" ADD CONSTRAINT "Section_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Article" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "dek" TEXT,
  "excerpt" TEXT,
  "heroImage" TEXT,
  "heroAlt" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "submittedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT,
  "sectionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_sectionId_publishedAt_idx" ON "Article"("sectionId", "publishedAt");

ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Article" ADD CONSTRAINT "Article_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ArticleSEO" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "metaTitle" TEXT,
  "metaDesc" TEXT,
  "canonical" TEXT,
  "socialTitle" TEXT,
  "socialDescription" TEXT,
  "socialImage" TEXT,
  "noindex" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ArticleSEO_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleSEO_articleId_key" ON "ArticleSEO"("articleId");
CREATE UNIQUE INDEX "ArticleSEO_slug_key" ON "ArticleSEO"("slug");

ALTER TABLE "ArticleSEO" ADD CONSTRAINT "ArticleSEO_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Homepage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL DEFAULT 'default',
  "title" TEXT NOT NULL DEFAULT 'Homepage',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoImage" TEXT,
  "settings" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Homepage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Homepage_slug_key" ON "Homepage"("slug");

CREATE TABLE "HomepageSection" (
  "id" TEXT NOT NULL,
  "homepageId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT,
  "position" INTEGER NOT NULL,
  "settings" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomepageSection_homepageId_key_key" ON "HomepageSection"("homepageId", "key");
CREATE UNIQUE INDEX "HomepageSection_homepageId_position_key" ON "HomepageSection"("homepageId", "position");

ALTER TABLE "HomepageSection" ADD CONSTRAINT "HomepageSection_homepageId_fkey"
  FOREIGN KEY ("homepageId") REFERENCES "Homepage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HomepageSlot" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "articleId" TEXT,
  "titleOverride" TEXT,
  "excerptOverride" TEXT,
  "imageOverride" TEXT,
  "hrefOverride" TEXT,
  "kickerOverride" TEXT,
  "settings" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomepageSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomepageSlot_sectionId_position_key" ON "HomepageSlot"("sectionId", "position");

ALTER TABLE "HomepageSlot" ADD CONSTRAINT "HomepageSlot_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomepageSlot" ADD CONSTRAINT "HomepageSlot_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HomepageVersion" (
  "id" TEXT NOT NULL,
  "homepageId" TEXT NOT NULL,
  "label" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "snapshot" TEXT NOT NULL,
  "previewToken" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomepageVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomepageVersion_previewToken_key" ON "HomepageVersion"("previewToken");
CREATE INDEX "HomepageVersion_homepageId_status_idx" ON "HomepageVersion"("homepageId", "status");
CREATE INDEX "HomepageVersion_scheduledFor_idx" ON "HomepageVersion"("scheduledFor");

ALTER TABLE "HomepageVersion" ADD CONSTRAINT "HomepageVersion_homepageId_fkey"
  FOREIGN KEY ("homepageId") REFERENCES "Homepage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomepageVersion" ADD CONSTRAINT "HomepageVersion_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ClassifiedListing" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "image" TEXT,
  "sellerName" TEXT NOT NULL,
  "sellerEmail" TEXT NOT NULL,
  "sellerPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'IN_REVIEW',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "submittedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClassifiedListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassifiedListing_slug_key" ON "ClassifiedListing"("slug");
CREATE INDEX "ClassifiedListing_status_publishedAt_expiresAt_idx" ON "ClassifiedListing"("status", "publishedAt", "expiresAt");
CREATE INDEX "ClassifiedListing_category_status_idx" ON "ClassifiedListing"("category", "status");

ALTER TABLE "ClassifiedListing" ADD CONSTRAINT "ClassifiedListing_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
