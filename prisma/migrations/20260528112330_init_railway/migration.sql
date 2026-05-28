-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'estudiante',
    "avatar" TEXT,
    "program" TEXT,
    "orcid" TEXT,
    "advisorId" TEXT,
    "advisorAssignedManually" BOOLEAN DEFAULT false,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "advisor" TEXT,
    "advisorId" TEXT,
    "program" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "content" TEXT,
    "iaScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "humanScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicReport" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "structureScore" DOUBLE PRECISION NOT NULL,
    "contentScore" DOUBLE PRECISION NOT NULL,
    "formScore" DOUBLE PRECISION NOT NULL,
    "originalityScore" DOUBLE PRECISION NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "estimatedLevel" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisProvider" TEXT,
    "findings" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,

    CONSTRAINT "AcademicReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OriginalityReport" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "aiContentScore" DOUBLE PRECISION NOT NULL,
    "aiDetectionLabel" TEXT NOT NULL,
    "totalSourcesFound" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectionMethod" TEXT NOT NULL DEFAULT 'simulated',

    CONSTRAINT "OriginalityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchedSource" (
    "id" TEXT NOT NULL,
    "originalityReportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "similarity" DOUBLE PRECISION NOT NULL,
    "sourceType" TEXT NOT NULL,

    CONSTRAINT "MatchedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighlightedSection" (
    "id" TEXT NOT NULL,
    "originalityReportId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" TEXT,

    CONSTRAINT "HighlightedSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "adjustedScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_orcid_key" ON "User"("orcid");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicReport_advanceId_key" ON "AcademicReport"("advanceId");

-- CreateIndex
CREATE UNIQUE INDEX "OriginalityReport_advanceId_key" ON "OriginalityReport"("advanceId");

-- CreateIndex
CREATE INDEX "HumanReview_advanceId_createdAt_idx" ON "HumanReview"("advanceId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicReport" ADD CONSTRAINT "AcademicReport_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "Advance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OriginalityReport" ADD CONSTRAINT "OriginalityReport_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "Advance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchedSource" ADD CONSTRAINT "MatchedSource_originalityReportId_fkey" FOREIGN KEY ("originalityReportId") REFERENCES "OriginalityReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightedSection" ADD CONSTRAINT "HighlightedSection_originalityReportId_fkey" FOREIGN KEY ("originalityReportId") REFERENCES "OriginalityReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "Advance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
