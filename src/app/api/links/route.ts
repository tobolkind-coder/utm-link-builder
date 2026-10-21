import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createLinkService, getUserLinksService } from '@/lib/services/link-service'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Не авторизован.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const search = searchParams.get('search') ?? undefined
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const onlyFavorites = searchParams.get('onlyFavorites') === 'true'

    const result = await getUserLinksService(user.id, {
      page: pageParam ? Number(pageParam) : undefined,
      pageSize: pageSizeParam ? Number(pageSizeParam) : undefined,
      search,
      dateFrom,
      dateTo,
      onlyFavorites,
    })

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
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
