import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { updateLinkUtmUrlService } from '@/lib/services/link-service'

export async function PUT(
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
    const link = await updateLinkUtmUrlService(id, user.id, body.utmUrl)
    return NextResponse.json({ success: true, data: link })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}