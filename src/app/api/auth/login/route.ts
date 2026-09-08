import { NextResponse } from 'next/server'
import { authenticateUser, createSession } from '@/lib/auth'
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from '@/lib/services/rate-limit-service'
import { getClientIp } from '@/lib/client-ip'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { login, password } = body

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: 'Логин и пароль обязательны.' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request.headers)

    const rateLimit = await checkLoginRateLimit(ip, login)
    if (rateLimit.blocked) {
      return NextResponse.json(
        {
          success: false,
          message: 'Слишком много неудачных попыток входа. Попробуйте позже.',
        },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      )
    }

    const user = await authenticateUser(login, password)
    if (!user) {
      await recordFailedLoginAttempt(ip, login)
      return NextResponse.json(
        { success: false, message: 'Неверный логин или пароль.' },
        { status: 401 }
      )
    }

    await resetLoginAttempts(ip, login)
    await createSession(user.id)

    return NextResponse.json({
      success: true,
      data: { id: user.id, login: user.login, fullName: user.fullName, role: user.role },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    )
  }
}
