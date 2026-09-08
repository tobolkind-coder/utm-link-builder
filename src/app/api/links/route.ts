import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createLinkService, getUserLinksService } from '@/lib/services/link-service'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Не авторизован.' },
        { status: 401 }
      )
    }

    const links = await getUserLinksService(user.id)
    return NextResponse.json({ success: true, data: links })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Не авторизован.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const link = await createLinkService(user.id, body)
    return NextResponse.json({ success: true, data: link })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    )
  }
}
