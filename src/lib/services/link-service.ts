import { createLink, isShortCodeUnique, isShortCodeTaken, getUserLinksPaginated, getLinkById, updateLink, updateLinkFavorite } from '@/lib/repositories/link-repository'
import { getSettings } from '@/lib/services/settings-service'
import { getCurrentLoginPath } from '@/lib/services/settings-service'
import { validateCustomShortCodeFormat, isReservedShortCode } from '@/lib/short-code'
import { Prisma } from '@prisma/client'

export interface CreateLinkRequest {
  url: string
  utmSource: string
  utmMedium?: string
  campaignPart1?: string
  campaignPart2?: string
  contentDate?: string
  contentText?: string
  customShortCode?: string
  comment?: string
}

export interface CreateLinkResponse {
  id: string
  originalUrl: string
  utmUrl: string
  shortUrl: string
  comment?: string | null
  isFavorite: boolean
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

async function resolveShortCode(customShortCode?: string): Promise<string> {
  if (customShortCode && customShortCode.trim() !== '') {
    const trimmed = customShortCode.trim()
    if (!validateCustomShortCodeFormat(trimmed)) {
      throw new Error('Адрес должен содержать 3-9 символов: латинские буквы, цифры, "-" и "_".')
    }
    const loginPath = await getCurrentLoginPath()
    if (isReservedShortCode(trimmed, loginPath)) {
      throw new Error(`Адрес "${trimmed}" зарезервирован системой и не может быть использован.`)
    }
    if (await isShortCodeTaken(trimmed)) {
      throw new Error(`Адрес "${trimmed}" уже занят. Выберите другой.`)
    }
    return trimmed
  }

  let shortCode = generateShortCode()
  let attempts = 0
  while (!(await isShortCodeUnique(shortCode)) && attempts < 10) {
    shortCode = generateShortCode()
    attempts++
  }
  if (attempts >= 10) {
    throw new Error('Не удалось сгенерировать уникальный код.')
  }
  return shortCode
}

export async function checkShortCodeAvailabilityService(code: string): Promise<{ available: boolean; reason?: string }> {
  const trimmed = code.trim()
  if (!validateCustomShortCodeFormat(trimmed)) {
    return { available: false, reason: 'Недопустимый формат. 3-9 символов: латинские буквы, цифры, "-" и "_".' }
  }
  const loginPath = await getCurrentLoginPath()
  if (isReservedShortCode(trimmed, loginPath)) {
    return { available: false, reason: 'Этот адрес зарезервирован системой.' }
  }
  if (await isShortCodeTaken(trimmed)) {
    return { available: false, reason: 'Адрес уже занят.' }
  }
  return { available: true }
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

  let shortCode: string
  try {
    shortCode = await resolveShortCode(request.customShortCode)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new Error(`Адрес "${request.customShortCode?.trim()}" уже занят. Выберите другой.`)
    }
    throw e
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
    comment: request.comment?.trim() || undefined,
  }).catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new Error(`Адрес "${shortCode}" уже занят. Выберите другой.`)
    }
    throw e
  })

  return {
    id: link.id,
    originalUrl: link.originalUrl,
    utmUrl: link.utmUrl,
    shortUrl: link.shortUrl,
    comment: link.comment,
    isFavorite: link.isFavorite,
    createdAt: link.createdAt,
  }
}

export interface GetUserLinksParams {
  page?: number
  pageSize?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  onlyFavorites?: boolean
}

const ALLOWED_PAGE_SIZES = [5, 10, 20, 50]

export async function getUserLinksService(userId: string, params: GetUserLinksParams = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = ALLOWED_PAGE_SIZES.includes(params.pageSize ?? 10)
    ? (params.pageSize ?? 10)
    : 10

  let dateFrom: Date | undefined
  let dateTo: Date | undefined

  if (params.dateFrom) {
    const parsed = new Date(params.dateFrom + 'T00:00:00.000Z')
    if (!isNaN(parsed.getTime())) dateFrom = parsed
  }
  if (params.dateTo) {
    const parsed = new Date(params.dateTo + 'T23:59:59.999Z')
    if (!isNaN(parsed.getTime())) dateTo = parsed
  }

  const { items, total } = await getUserLinksPaginated(userId, {
    page,
    pageSize,
    search: params.search?.trim() || undefined,
    dateFrom,
    dateTo,
    onlyFavorites: params.onlyFavorites,
  })

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
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

export async function toggleFavoriteLinkService(
  id: string,
  userId: string,
  isFavorite: boolean
) {
  const link = await getLinkById(id)
  if (!link) {
    throw new Error('Ссылка не найдена.')
  }
  if (link.userId !== userId) {
    throw new Error('Недостаточно прав для редактирования этой ссылки.')
  }

  await updateLinkFavorite(id, userId, isFavorite)
  return { id, isFavorite }
}

export async function updateLinkUtmUrlService(
  id: string,
  userId: string,
  newUtmUrl: string,
  comment?: string | null
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

  const updateData: Parameters<typeof updateLink>[1] = {
    originalUrl: utmUrl, // URL без utm-параметров
    utmUrl: finalUrl.toString(),
    utmSource: utmParams.utmSource,
    utmMedium: utmParams.utmMedium,
    utmCampaign: utmParams.utmCampaign,
    utmContent: utmParams.utmContent,
  }

  if (comment !== undefined) {
    updateData.comment = comment?.trim() || null
  }

  const updated = await updateLink(id, updateData)

  return {
    id: updated.id,
    originalUrl: updated.originalUrl,
    utmUrl: updated.utmUrl,
    shortUrl: updated.shortUrl,
    comment: updated.comment,
    isFavorite: updated.isFavorite,
    createdAt: updated.createdAt,
  }
}
