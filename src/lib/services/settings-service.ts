import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const LOGIN_PATH_REGEX = /^[a-z0-9-]{10,50}$/

export async function getSettings() {
  return prisma.settings.findFirst()
}

export async function updateSettings(data: {
  serviceName?: string
  shortDomain?: string
  logo?: string
  favicon?: string
  instructionUrl?: string
  customLoginPath?: string
  loginAttemptsLimit?: number
  loginBlockDuration?: number
}) {
  const settings = await prisma.settings.findFirst()
  if (!settings) {
    return prisma.settings.create({
      data: {
        serviceName: data.serviceName ?? '',
        shortDomain: data.shortDomain ?? '',
        logo: data.logo,
        favicon: data.favicon,
        instructionUrl: data.instructionUrl,
        customLoginPath: data.customLoginPath ?? generateRandomLoginPath(),
        loginAttemptsLimit: data.loginAttemptsLimit,
        loginBlockDuration: data.loginBlockDuration,
      },
    })
  }
  return prisma.settings.update({ where: { id: settings.id }, data })
}

/**
 * Генерирует случайный уникальный путь для страницы входа.
 * Формат: /auth-<16 случайных hex-символов> (итого длина строки без слэша >= 21 символ)
 */
export function generateRandomLoginPath(): string {
  const randomPart = crypto.randomBytes(8).toString('hex')
  return `auth-${randomPart}`
}

export function validateLoginPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, '')
  return LOGIN_PATH_REGEX.test(normalized)
}

export function normalizeLoginPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '')
}

/**
 * Возвращает текущий путь входа. Если не задан в Settings — возвращает дефолтный 'login'
 * (для обратной совместимости при первом запуске до применения сидов).
 */
export async function getCurrentLoginPath(): Promise<string> {
  const settings = await getSettings()
  return settings?.customLoginPath || 'login'
}
