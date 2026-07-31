import { NextResponse } from 'next/server'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { updateUserService, blockUserService } from '@/lib/services/user-service'

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

    // Restore: set isDeleted and isActive
    if (body.isDeleted === false || body.isActive === true) {
      const { prisma } = await import('@/lib/prisma')
      await prisma.user.update({
        where: { id },
        data: {
          isDeleted: false,
          isActive: body.isActive ?? true,
          deletedAt: null,
        },
      })
      return NextResponse.json({ success: true })
    }

    const updatedUser = await updateUserService(id, body, user.id, user.role)
    return NextResponse.json({ success: true, data: updatedUser })
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
    if (!user || !hasRole(user, 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Недостаточно прав.' }, { status: 403 })
    }
    const { id } = await params
    await blockUserService(id, user.id, user.role)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера.'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
