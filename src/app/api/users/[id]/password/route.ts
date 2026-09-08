import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { changePasswordService } from '@/lib/services/user-service'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const { password } = body
    if (!password) {
      return NextResponse.json({ success: false, message: 'Пароль обязателен.' }, { status: 400 })
    }
    await changePasswordService(id, password, user.id, user.role)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
