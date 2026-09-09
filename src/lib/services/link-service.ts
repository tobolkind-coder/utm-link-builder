import { createLink, isShortCodeUnique, getUserLinks, getLinkById, updateLink } from '@/lib/repositories/link-repository'
import { getSettings } from '@/lib/services/settings-service'

export interface CreateLinkRequest {
  url: string
  utmSource: string
  utmMedium?: string
  campaignPart1?: string
  campaignPart2?: string
  contentDate?: string
  contentText?: string
}

export interface CreateLinkResponse {
  originalUrl: string
  utmUrl: string
  shortUrl: string
  createdAt: Date
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = Math.floor(Math.random() * 3) + 6
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}

function removeExistingUtmParams(urlString: string): URL {
  const url = new URL(urlString)
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  utmParams.forEach(param => url.searchParams.delete(param))
  return url
}

function buildCampaign(part1?: string, part2?: string): string | undefined {
  if (!part1 && !part2) return undefined
  if (part1 && part2) return `${part1}_${part2}`
  return part1 || part2
}

function buildContent(date?: string, text?: string): string | undefined {
  const hasDate = date !== undefined && date !== ''
  if (!hasDate && !text) return undefined
  const dateStr = hasDate
    ? date!.replace(/-/g, '')
    : date === undefined
      ? new Date().toISOString().slice(0, 10).replace(/-/g, '')
      : ''
  if (!dateStr) return text
  if (!text) return dateStr
  return `${dateStr}_${text}`
}

export async function createLinkService(
  userId: string,
  request: CreateLinkRequest
): Promise<CreateLinkResponse> {
  if (!request.url || !request.utmSource) {
    throw new Error('URL и UTM Source обязательны.')
  }

  const normalizedUrl = normalizeUrl(request.url)
  let url: URL
  try {
    url = new URL(normalizedUrl)
  } catch {
    throw new Error('Некорректный URL.')
  }

  const cleanUrl = removeExistingUtmParams(url.toString())
  cleanUrl.searchParams.set('utm_source', request.utmSource)
  if (request.utmMedium) {
    cleanUrl.searchParams.set('utm_medium', request.utmMedium)
  }
  const campaign = buildCampaign(request.campaignPart1, request.campaignPart2)
  if (campaign) {
    cleanUrl.searchParams.set('utm_campaign', campaign)
  }
  const content = buildContent(request.contentDate, request.contentText)
  if (content) {
    cleanUrl.searchParams.set('utm_content', content)
  }

  const utmUrl = cleanUrl.toString()

  let shortCode = generateShortCode()
  let attempts = 0
  while (!(await isShortCodeUnique(shortCode)) && attempts < 10) {
    shortCode = generateShortCode()
    attempts++
  }

  if (attempts >= 10) {
    throw new Error('Не удалось сгенерировать уникальный код.')
  }

  const settings = await getSettings()
  if (!settings) {
    throw new Error('Короткий домен не настроен.')
  }

  const protocol = process.env.NEXTAUTH_URL?.startsWith('https') ? 'https' : 'http'
  const shortUrl = `${protocol}://${settings.shortDomain}/${shortCode}`

  const link = await createLink({
    userId,
    originalUrl: request.url,
    utmUrl,
    shortCode,
    shortUrl,
    utmSource: request.utmSource,
    utmMedium: request.utmMedium,
    utmCampaign: campaign,
    utmContent: content,
  })

  return {
    originalUrl: link.originalUrl,
    utmUrl: link.utmUrl,
    shortUrl: link.shortUrl,
    createdAt: link.createdAt,
  }
}

export async function getUserLinksService(userId: string) {
  return getUserLinks(userId, 50)
}

function parseUtmParams(urlString: string): {
  utmSource: string
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
} {
  const url = new URL(urlString)
  const getParam = (name: string) => {
    const val = url.searchParams.get(name)
    return val !== null && val !== '' ? val : null
  }
  const source = getParam('utm_source')
  if (!source) {
    throw new Error('UTM Source обязателен в UTM-ссылке.')
  }
  return {
    utmSource: source,
    utmMedium: getParam('utm_medium'),
    utmCampaign: getParam('utm_campaign'),
    utmContent: getParam('utm_content'),
  }
}

export async function updateLinkUtmUrlService(
  id: string,
  userId: string,
  newUtmUrl: string
) {
  const link = await getLinkById(id)
  if (!link) {
    throw new Error('Ссылка не найдена.')
  }
  if (link.userId !== userId) {
    throw new Error('Недостаточно прав для редактирования этой ссылки.')
  }

  const normalizedUrl = normalizeUrl(newUtmUrl)
  let url: URL
  try {
    url = new URL(normalizedUrl)
  } catch {
    throw new Error('Некорректный URL.')
  }

  // Удаляем старые utm-параметры и получаем чистый URL
  const cleanUrl = removeExistingUtmParams(url.toString())

  // Проверяем что utm_source присутствует
  const source = url.searchParams.get('utm_source')
  if (!source || source === '') {
    throw new Error('UTM Source (utm_source) обязателен в UTM-ссылке.')
  }

  // Парсим utm-параметры из нового URL
  const utmParams = parseUtmParams(url.toString())

  const utmUrl = cleanUrl.toString()
  // Восстанавливаем utm-параметры в URL для хранения в БД
  const finalUrl = new URL(utmUrl)
  finalUrl.searchParams.set('utm_source', utmParams.utmSource)
  if (utmParams.utmMedium) finalUrl.searchParams.set('utm_medium', utmParams.utmMedium)
  if (utmParams.utmCampaign) finalUrl.searchParams.set('utm_campaign', utmParams.utmCampaign)
  if (utmParams.utmContent) finalUrl.searchParams.set('utm_content', utmParams.utmContent)

  const updated = await updateLink(id, {
    originalUrl: utmUrl, // URL без utm-параметров
    utmUrl: finalUrl.toString(),
    utmSource: utmParams.utmSource,
    utmMedium: utmParams.utmMedium,
    utmCampaign: utmParams.utmCampaign,
    utmContent: utmParams.utmContent,
  })

  return {
    id: updated.id,
    originalUrl: updated.originalUrl,
    utmUrl: updated.utmUrl,
    shortUrl: updated.shortUrl,
    createdAt: updated.createdAt,
  }
}
