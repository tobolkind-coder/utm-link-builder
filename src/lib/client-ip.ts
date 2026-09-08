/**
 * Определяет IP клиента для лимита попыток входа.
 *
 * X-Real-IP приоритетнее: nginx подставляет туда $remote_addr, и клиент на это
 * значение повлиять не может. X-Forwarded-For остаётся запасным вариантом на
 * случай другого обратного прокси, но берётся только первый элемент — раньше
 * клиент мог дописать туда произвольный адрес и обойти блокировку по IP.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim()
    if (first) {
      return first
    }
  }

  return 'unknown'
}
