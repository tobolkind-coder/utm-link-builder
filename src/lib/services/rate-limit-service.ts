import {
  findAttempt,
  upsertAttempt,
  resetAttempt,
  cleanupOldAttempts,
} from '@/lib/repositories/login-attempt-repository'
import { getSettings } from '@/lib/services/settings-service'

const DEFAULT_ATTEMPTS_LIMIT = 5
const DEFAULT_BLOCK_DURATION_SEC = 300 // 5 минут
const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 часа

export interface RateLimitResult {
  blocked: boolean
  retryAfterSeconds?: number
}

async function getLimits(): Promise<{ attemptsLimit: number; blockDurationSec: number }> {
  const settings = await getSettings()
  return {
    attemptsLimit: settings?.loginAttemptsLimit ?? DEFAULT_ATTEMPTS_LIMIT,
    blockDurationSec: settings?.loginBlockDuration ?? DEFAULT_BLOCK_DURATION_SEC,
  }
}

async function checkIdentifier(identifier: string): Promise<RateLimitResult> {
  const attempt = await findAttempt(identifier)
  if (!attempt || !attempt.blockedUntil) {
    return { blocked: false }
  }
  const now = new Date()
  if (attempt.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000)
    return { blocked: true, retryAfterSeconds }
  }
  return { blocked: false }
}

/**
 * Проверяет блокировку по IP и по логину (комбинированный подход).
 * Возвращает блокировку, если заблокирован хотя бы один из идентификаторов.
 */
export async function checkLoginRateLimit(ip: string, login: string): Promise<RateLimitResult> {
  const ipResult = await checkIdentifier(`ip:${ip}`)
  if (ipResult.blocked) return ipResult

  const loginResult = await checkIdentifier(`login:${login.toLowerCase()}`)
  if (loginResult.blocked) return loginResult

  return { blocked: false }
}

async function recordFailure(identifier: string, attemptsLimit: number, blockDurationSec: number) {
  const existing = await findAttempt(identifier)
  const now = new Date()

  if (!existing) {
    await upsertAttempt(identifier, { attempts: 1, lastAttempt: now, blockedUntil: null })
    return
  }

  const newAttempts = existing.attempts + 1
  let blockedUntil: Date | null = existing.blockedUntil ?? null

  if (newAttempts >= attemptsLimit) {
    blockedUntil = new Date(now.getTime() + blockDurationSec * 1000)
  }

  await upsertAttempt(identifier, { attempts: newAttempts, lastAttempt: now, blockedUntil })
}

/**
 * Фиксирует неудачную попытку входа как по IP, так и по логину.
 */
export async function recordFailedLoginAttempt(ip: string, login: string): Promise<void> {
  const { attemptsLimit, blockDurationSec } = await getLimits()
  await recordFailure(`ip:${ip}`, attemptsLimit, blockDurationSec)
  await recordFailure(`login:${login.toLowerCase()}`, attemptsLimit, blockDurationSec)
}

/**
 * Сбрасывает счетчики неудачных попыток после успешного входа.
 */
export async function resetLoginAttempts(ip: string, login: string): Promise<void> {
  await resetAttempt(`ip:${ip}`)
  await resetAttempt(`login:${login.toLowerCase()}`)
}

/**
 * Очищает устаревшие записи о попытках входа (не заблокированные).
 */
export async function cleanupExpiredAttempts(): Promise<void> {
  await cleanupOldAttempts(CLEANUP_MAX_AGE_MS)
}
