-- Add customLoginPath to Settings
ALTER TABLE "Settings" ADD COLUMN "customLoginPath" VARCHAR(255);
ALTER TABLE "Settings" ADD COLUMN "loginAttemptsLimit" INTEGER DEFAULT 5;
ALTER TABLE "Settings" ADD COLUMN "loginBlockDuration" INTEGER DEFAULT 300;

-- Create LoginAttempt table for rate limiting
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastAttempt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_idx" ON "LoginAttempt"("identifier");
CREATE INDEX "LoginAttempt_blockedUntil_idx" ON "LoginAttempt"("blockedUntil");
