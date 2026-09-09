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

export async function getLinkById(id: string) {
  return prisma.link.findUnique({ where: { id } })
}

export interface UpdateLinkData {
  originalUrl?: string
  utmUrl?: string
  utmSource?: string
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
}

export async function updateLink(id: string, data: UpdateLinkData) {
  return prisma.link.update({ where: { id }, data })
}
