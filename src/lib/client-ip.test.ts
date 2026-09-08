import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/client-ip'

describe('getClientIp', () => {
  it('предпочитает X-Real-IP подделанному X-Forwarded-For', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '203.0.113.10',
    })
    expect(getClientIp(headers)).toBe('203.0.113.10')
  })

  it('берёт первый элемент X-Forwarded-For, если X-Real-IP отсутствует', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' })
    expect(getClientIp(headers)).toBe('203.0.113.10')
  })

  it('обрезает пробелы вокруг адреса', () => {
    const headers = new Headers({ 'x-forwarded-for': '  203.0.113.10  , 10.0.0.1' })
    expect(getClientIp(headers)).toBe('203.0.113.10')
  })

  it('возвращает unknown при пустом X-Forwarded-For', () => {
    const headers = new Headers({ 'x-forwarded-for': '   ' })
    expect(getClientIp(headers)).toBe('unknown')
  })

  it('возвращает unknown, когда заголовков нет', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})
