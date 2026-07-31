-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "utmUrl" TEXT NOT NULL,
    "shortCode" VARCHAR(20) NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "utmSource" VARCHAR(255) NOT NULL,
    "utmMedium" VARCHAR(255),
    "utmCampaign" VARCHAR(255),
    "utmContent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    "shortDomain" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(500),
    "favicon" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmSource" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmMedium" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmMedium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmCampaignPart1" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmCampaignPart1_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmCampaignPart2" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmCampaignPart2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Link_shortCode_key" ON "Link"("shortCode");

-- CreateIndex
CREATE INDEX "Link_userId_idx" ON "Link"("userId");

-- CreateIndex
CREATE INDEX "Link_createdAt_idx" ON "Link"("createdAt");

-- CreateIndex
CREATE INDEX "Link_utmSource_idx" ON "Link"("utmSource");

-- CreateIndex
CREATE INDEX "UtmSource_sortOrder_idx" ON "UtmSource"("sortOrder");

-- CreateIndex
CREATE INDEX "UtmSource_isActive_idx" ON "UtmSource"("isActive");

-- CreateIndex
CREATE INDEX "UtmMedium_sortOrder_idx" ON "UtmMedium"("sortOrder");

-- CreateIndex
CREATE INDEX "UtmMedium_isActive_idx" ON "UtmMedium"("isActive");

-- CreateIndex
CREATE INDEX "UtmCampaignPart1_sortOrder_idx" ON "UtmCampaignPart1"("sortOrder");

-- CreateIndex
CREATE INDEX "UtmCampaignPart1_isActive_idx" ON "UtmCampaignPart1"("isActive");

-- CreateIndex
CREATE INDEX "UtmCampaignPart2_sortOrder_idx" ON "UtmCampaignPart2"("sortOrder");

-- CreateIndex
CREATE INDEX "UtmCampaignPart2_isActive_idx" ON "UtmCampaignPart2"("isActive");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
