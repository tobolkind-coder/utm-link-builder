import { describe, it, expect } from 'vitest'
import {
  validateCustomShortCodeFormat,
  isReservedShortCode,
  RESERVED_SHORT_CODES,
  CUSTOM_SHORT_CODE_MIN_LENGTH,
  CUSTOM_SHORT_CODE_MAX_LENGTH,
  ANY_SHORT_CODE_REGEX,
} from '@/lib/short-code'

describe('validateCustomShortCodeFormat', () => {
  it('принимает валидный код из букв, цифр, "-" и "_"', () => {
    expect(validateCustomShortCodeFormat('ivan_b')).toBe(true)
    expect(validateCustomShortCodeFormat('blogerx1')).toBe(true)
    expect(validateCustomShortCodeFormat('a-b_c')).toBe(true)
    expect(validateCustomShortCodeFormat('ivan_9')).toBe(true)
  })

  it('принимает минимальную длину 3 символа', () => {
    expect(validateCustomShortCodeFormat('abc')).toBe(true)
  })

  it('принимает максимальную длину 9 символов', () => {
    expect(validateCustomShortCodeFormat('abcdefghi')).toBe(true)
  })

  it('отклоняет код короче 3 символов', () => {
    expect(validateCustomShortCodeFormat('ab')).toBe(false)
    expect(validateCustomShortCodeFormat('')).toBe(false)
  })

  it('отклоняет код длиннее 9 символов', () => {
    expect(validateCustomShortCodeFormat('abcdefghij')).toBe(false)
  })

  it('отклоняет недопустимые символы', () => {
    expect(validateCustomShortCodeFormat('ivan blogger')).toBe(false)
    expect(validateCustomShortCodeFormat('кириллица')).toBe(false)
    expect(validateCustomShortCodeFormat('ivan.blogger')).toBe(false)
    expect(validateCustomShortCodeFormat('ivan/blogger')).toBe(false)
  })
})

describe('isReservedShortCode', () => {
  it('считает зарезервированные слова занятыми без учёта регистра', () => {
    expect(isReservedShortCode('admin')).toBe(true)
    expect(isReservedShortCode('ADMIN')).toBe(true)
    expect(isReservedShortCode('Dashboard')).toBe(true)
    expect(isReservedShortCode('login')).toBe(true)
  })

  it('не считает обычные слова зарезервированными', () => {
    expect(isReservedShortCode('ivan_blogger')).toBe(false)
    expect(isReservedShortCode('blogerx1')).toBe(false)
  })

  it('учитывает текущий путь входа', () => {
    expect(isReservedShortCode('auth-abc123', 'auth-abc123')).toBe(true)
    expect(isReservedShortCode('AUTH-ABC123', 'auth-abc123')).toBe(true)
    expect(isReservedShortCode('ivan', 'auth-abc123')).toBe(false)
  })

  it('все зарезервированные слова соответствуют общему паттерну длины', () => {
    for (const word of RESERVED_SHORT_CODES) {
      expect(ANY_SHORT_CODE_REGEX.test(word)).toBe(true)
    }
  })
})

describe('константы длин', () => {
  it('кастомный диапазон не пересекается с login-path (мин. 10)', () => {
    expect(CUSTOM_SHORT_CODE_MAX_LENGTH).toBeLessThan(10)
    expect(CUSTOM_SHORT_CODE_MIN_LENGTH).toBeGreaterThanOrEqual(3)
  })
})