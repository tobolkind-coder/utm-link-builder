import { prisma } from '@/lib/prisma'

export type UtmModel = 'utmSource' | 'utmMedium' | 'utmCampaignPart1' | 'utmCampaignPart2'

export interface CreateUtmItem {
  name: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateUtmItem {
  name?: string
  sortOrder?: number
  isActive?: boolean
}

type UtmDelegate = {
  findMany(args?: { where?: { isActive?: boolean }; orderBy?: { sortOrder?: 'asc' | 'desc' } }): Promise<{ id: string; name: string; sortOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }[]>
  create(args: { data: CreateUtmItem }): Promise<{ id: string; name: string; sortOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }>
  update(args: { where: { id: string }; data: UpdateUtmItem }): Promise<{ id: string; name: string; sortOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }>
}

function getModel(model: UtmModel): UtmDelegate {
  switch (model) {
    case 'utmSource':
      return prisma.utmSource as unknown as UtmDelegate
    case 'utmMedium':
      return prisma.utmMedium as unknown as UtmDelegate
    case 'utmCampaignPart1':
      return prisma.utmCampaignPart1 as unknown as UtmDelegate
    case 'utmCampaignPart2':
      return prisma.utmCampaignPart2 as unknown as UtmDelegate
  }
}

export async function getUtmItems(model: UtmModel, includeInactive: boolean = false) {
  return getModel(model).findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createUtmItem(model: UtmModel, data: CreateUtmItem) {
  return getModel(model).create({ data })
}

export async function updateUtmItem(model: UtmModel, id: string, data: UpdateUtmItem) {
  return getModel(model).update({ where: { id }, data })
}

export async function deleteUtmItem(model: UtmModel, id: string) {
  return getModel(model).update({
    where: { id },
    data: { isActive: false },
  })
}
