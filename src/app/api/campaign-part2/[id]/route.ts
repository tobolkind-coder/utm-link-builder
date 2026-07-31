import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { updateItem, toggleActive } from '@/lib/services/utm-service'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'EDITOR')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const item = await updateItem('utmCampaignPart2', id, body)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'EDITOR')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const { id } = await params
    const item = await toggleActive('utmCampaignPart2', id, false)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
