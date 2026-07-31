import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { getUsersService, createUserService } from '@/lib/services/user-service'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const users = await getUsersService(includeDeleted)
    return NextResponse.json({ success: true, data: users })
  } catch {
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const body = await request.json()
    const newUser = await createUserService(body)
    return NextResponse.json({ success: true, data: newUser })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
