import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { getItems, createItem } from '@/lib/services/utm-service'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Не авторизован.' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true' && hasRole(user, 'EDITOR')
    const items = await getItems('utmCampaignPart1', includeInactive)
    return NextResponse.json({ success: true, data: items })
  } catch {
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasRole(user, 'EDITOR')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const body = await request.json()
    const item = await createItem('utmCampaignPart1', body)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
