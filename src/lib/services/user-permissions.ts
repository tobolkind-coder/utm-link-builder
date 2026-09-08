import type { UserRole } from '@/lib/auth'

/**
 * Минимум сведений о цели, достаточный для проверки прав.
 */
export interface ManageableUser {
  id: string
  role: UserRole
}

/**
 * Единая политика: кто кем может управлять.
 *
 * Вызывается из смены пароля, редактирования, блокировки и восстановления.
 * Именно расхождение этих правил между эндпоинтами позволяло администратору
 * сменить пароль суперадминистратору, поэтому политика живёт в одном месте.
 *
 * Функция намеренно не ходит в БД: цель передаёт вызывающий сервис. Так политику
 * можно проверить тестами без моков Prisma.
 */
export function assertCanManageUser(
  target: ManageableUser,
  actorId: string,
  actorRole: UserRole
): void {
  if (target.role === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') {
    throw new Error('Недостаточно прав для работы с суперадминистратором.')
  }

  if (actorRole === 'ADMIN' && target.role === 'ADMIN' && target.id !== actorId) {
    throw new Error('Недостаточно прав для редактирования администратора.')
  }
}
