import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

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
  return prisma.link.findFirst({ where: { shortCode: { equals: shortCode, mode: 'insensitive' } } })
}

export async function isShortCodeUnique(shortCode: string): Promise<boolean> {
  const existing = await prisma.link.findUnique({ where: { shortCode } })
  return existing === null
}

export async function isShortCodeTaken(shortCode: string): Promise<boolean> {
  const existing = await prisma.link.findFirst({
    where: { shortCode: { equals: shortCode, mode: 'insensitive' } },
  })
  return existing !== null
}

export interface GetUserLinksPaginatedParams {
  page: number
  pageSize: number
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export async function getUserLinksPaginated(
  userId: string,
  { page, pageSize, search, dateFrom, dateTo }: GetUserLinksPaginatedParams
) {
  const where: Prisma.LinkWhereInput = { userId }

  if (search) {
    where.OR = [
      { shortUrl: { contains: search, mode: 'insensitive' } },
      { utmUrl: { contains: search, mode: 'insensitive' } },
      { originalUrl: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.link.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.link.count({ where }),
  ])

  return { items, total }
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
