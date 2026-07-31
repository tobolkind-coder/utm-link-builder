import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import {
  getSettings,
  updateSettings,
  validateLoginPath,
  normalizeLoginPath,
} from '@/lib/services/settings-service'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Не авторизован.' }, { status: 401 })
    }
    const settings = await getSettings()

    // Кастомный путь входа виден только SUPERADMIN
    if (settings && !hasRole(user, 'SUPERADMIN')) {
      const { customLoginPath: _customLoginPath, ...rest } = settings
      return NextResponse.json({ success: true, data: rest })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch {
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const body = await request.json()

    if (body.shortDomain) {
      body.shortDomain = body.shortDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }

    if (Object.prototype.hasOwnProperty.call(body, 'customLoginPath')) {
      if (!hasRole(user, 'SUPERADMIN')) {
        return NextResponse.json(
          { success: false, message: 'Изменять путь входа может только SUPERADMIN.' },
          { status: 403 }
        )
      }
      const normalized = normalizeLoginPath(String(body.customLoginPath || ''))
      if (!validateLoginPath(normalized)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Некорректный путь входа. Допустимы латинские буквы, цифры и дефис, длина 10-50 символов.',
          },
          { status: 400 }
        )
      }
      body.customLoginPath = normalized
    }

    const settings = await updateSettings(body)
    return NextResponse.json({ success: true, data: settings })
  } catch {
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера.' }, { status: 500 })
  }
}
