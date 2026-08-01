CREATE TABLE "MoodSurveyVote" (
  "id" TEXT NOT NULL,
  "homepageId" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "surveyDay" TEXT NOT NULL,
  "optionKey" TEXT NOT NULL,
  "optionLabel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MoodSurveyVote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MoodSurveyVote"
ADD CONSTRAINT "MoodSurveyVote_homepageId_fkey"
FOREIGN KEY ("homepageId") REFERENCES "Homepage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MoodSurveyVote_homepageId_visitorId_surveyDay_key"
ON "MoodSurveyVote"("homepageId", "visitorId", "surveyDay");

CREATE INDEX "MoodSurveyVote_homepageId_surveyDay_idx"
ON "MoodSurveyVote"("homepageId", "surveyDay");

CREATE INDEX "MoodSurveyVote_homepageId_createdAt_idx"
ON "MoodSurveyVote"("homepageId", "createdAt");
