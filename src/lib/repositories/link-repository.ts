import { prisma } from '@/lib/prisma'

export interface CreateLinkData {
  userId: string
  originalUrl: string
  utmUrl: string
  shortCode: string
  shortUrl: string
  utmSource: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
}

export async function createLink(data: CreateLinkData) {
  return prisma.link.create({ data })
}

export async function findLinkByShortCode(shortCode: string) {
  return prisma.link.findUnique({ where: { shortCode } })
}

export async function isShortCodeUnique(shortCode: string): Promise<boolean> {
  const existing = await prisma.link.findUnique({ where: { shortCode } })
  return existing === null
}

export async function getUserLinks(userId: string, limit: number = 50) {
  return prisma.link.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
