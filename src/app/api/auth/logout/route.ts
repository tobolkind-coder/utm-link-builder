import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'
import { getCurrentLoginPath } from '@/lib/services/settings-service'

export async function POST() {
  try {
    await destroySession()
    const loginPath = await getCurrentLoginPath()
    return NextResponse.json({ success: true, data: { loginPath: `/${loginPath}` } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    )
  }
}
