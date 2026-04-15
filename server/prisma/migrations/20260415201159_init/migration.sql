-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "segments" JSONB NOT NULL DEFAULT '[]',
    "speakers" JSONB NOT NULL DEFAULT '[]',
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transcript_status_idx" ON "Transcript"("status");

-- CreateIndex
CREATE INDEX "Transcript_createdAt_idx" ON "Transcript"("createdAt");

-- CreateIndex
CREATE INDEX "Transcript_isDeleted_idx" ON "Transcript"("isDeleted");
