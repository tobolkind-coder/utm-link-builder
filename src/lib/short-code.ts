// Единая точка истины для формата коротких кодов.
// Используется в трёх местах: link-service.ts (генерация/валидация),
// [...slug]/page.tsx (редирект) и middleware.ts (noindex-логика),
// плюс link-repository.ts для поиска без учёта регистра.

export const SHORT_CODE_MIN_LENGTH = 6
export const SHORT_CODE_MAX_LENGTH = 8
export const CUSTOM_SHORT_CODE_MIN_LENGTH = 3
// < 10, чтобы не пересекаться с customLoginPath (мин. 10 символов)
export const CUSTOM_SHORT_CODE_MAX_LENGTH = 9

// Автогенерируемые коды: только буквы+цифры, 6-8 символов (как раньше)
export const AUTO_SHORT_CODE_REGEX = /^[a-zA-Z0-9]{6,8}$/

// Кастомные коды: буквы, цифры, "-", "_", 3-9 символов
export const CUSTOM_SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,9}$/

// Общий паттерн для middleware/редиректа — объединяет оба случая
export const ANY_SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,9}$/

export const RESERVED_SHORT_CODES = [
  'admin',
  'api',
  'dashboard',
  'login',
  'auth',
  'favicon',
  'health',
  'robots',
  'sitemap',
  'manifest',
  '_next',
  'public',
  'static',
]

export function isReservedShortCode(code: string, currentLoginPath?: string | null): boolean {
  const lower = code.toLowerCase()
  if (RESERVED_SHORT_CODES.includes(lower)) return true
  if (currentLoginPath && lower === currentLoginPath.toLowerCase()) return true
  return false
}

export function validateCustomShortCodeFormat(code: string): boolean {
  return CUSTOM_SHORT_CODE_REGEX.test(code)
}