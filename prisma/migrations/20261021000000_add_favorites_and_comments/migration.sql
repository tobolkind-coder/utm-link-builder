-- Add isFavorite and comment to Link
ALTER TABLE "Link" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Link" ADD COLUMN "comment" TEXT;

-- CreateIndex
CREATE INDEX "Link_isFavorite_idx" ON "Link"("isFavorite");