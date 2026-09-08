import { describe, it, expect } from 'vitest'
import { assertCanManageUser } from '@/lib/services/user-permissions'

const SUPERADMIN = { id: 'target-super', role: 'SUPERADMIN' as const }
const ADMIN = { id: 'target-admin', role: 'ADMIN' as const }
const EDITOR = { id: 'target-editor', role: 'EDITOR' as const }
const USER = { id: 'target-user', role: 'USER' as const }

describe('assertCanManageUser', () => {
  it('запрещает ADMIN управлять SUPERADMIN', () => {
    expect(() => assertCanManageUser(SUPERADMIN, 'actor-admin', 'ADMIN')).toThrow(
      'Недостаточно прав для работы с суперадминистратором.'
    )
  })

  it('разрешает SUPERADMIN управлять SUPERADMIN', () => {
    expect(() => assertCanManageUser(SUPERADMIN, 'actor-super', 'SUPERADMIN')).not.toThrow()
  })

  it('запрещает ADMIN управлять другим ADMIN', () => {
    expect(() => assertCanManageUser(ADMIN, 'actor-admin', 'ADMIN')).toThrow(
      'Недостаточно прав для редактирования администратора.'
    )
  })

  it('разрешает ADMIN управлять самим собой', () => {
    expect(() => assertCanManageUser(ADMIN, ADMIN.id, 'ADMIN')).not.toThrow()
  })

  it('разрешает ADMIN управлять EDITOR и USER', () => {
    expect(() => assertCanManageUser(EDITOR, 'actor-admin', 'ADMIN')).not.toThrow()
    expect(() => assertCanManageUser(USER, 'actor-admin', 'ADMIN')).not.toThrow()
  })

  it('разрешает SUPERADMIN управлять ADMIN', () => {
    expect(() => assertCanManageUser(ADMIN, 'actor-super', 'SUPERADMIN')).not.toThrow()
  })
})
