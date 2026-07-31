import { getUtmItems, createUtmItem, updateUtmItem, type UtmModel } from '@/lib/repositories/utm-repository'

export async function getItems(model: UtmModel, includeInactive: boolean = false) {
  return getUtmItems(model, includeInactive)
}

export async function createItem(model: UtmModel, data: { name: string; sortOrder?: number; isActive?: boolean }) {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Название обязательно.')
  }
  return createUtmItem(model, { ...data, name: data.name.trim() })
}

export async function updateItem(model: UtmModel, id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) {
  if (data.name !== undefined && data.name.trim() === '') {
    throw new Error('Название не может быть пустым.')
  }
  return updateUtmItem(model, id, { ...data, name: data.name?.trim() })
}

export async function toggleActive(model: UtmModel, id: string, isActive: boolean) {
  return updateUtmItem(model, id, { isActive })
}
