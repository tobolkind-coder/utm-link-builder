import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { checkShortCodeAvailabilityService } from '@/lib/services/link-service'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Не авторизован.' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code') ?? ''
    if (!code.trim()) {
      return NextResponse.json({ success: true, data: { available: false, reason: 'Введите адрес.' } })
    }
    const result = await checkShortCodeAvailabilityService(code)
    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    )
  }
}