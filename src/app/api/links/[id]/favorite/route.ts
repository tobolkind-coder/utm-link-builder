import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { toggleFavoriteLinkService } from '@/lib/services/link-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Не авторизован.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const isFavorite = Boolean(body.isFavorite)
    const result = await toggleFavoriteLinkService(id, user.id, isFavorite)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}