import bcrypt from 'bcryptjs'
import type { UserRole } from '@/lib/auth'
import {
  getUsers,
  getUserById,
  getUserByLogin,
  createUser,
  updateUser,
  blockUser,
  getSuperAdminCount,
} from '@/lib/repositories/user-repository'

export async function getUsersService(includeDeleted: boolean = false) {
  return getUsers(includeDeleted)
}

export async function getUserByIdService(id: string) {
  return getUserById(id)
}

export async function createUserService(data: {
  login: string
  fullName: string
  password: string
  role: UserRole
  isActive?: boolean
}) {
  if (!data.login || data.login.length < 3 || data.login.length > 100) {
    throw new Error('Логин должен содержать от 3 до 100 символов.')
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(data.login)) {
    throw new Error('Логин может содержать только латинские буквы, цифры, _, -, .')
  }
  const existing = await getUserByLogin(data.login)
  if (existing) {
    throw new Error('Пользователь с таким логином уже существует.')
  }
  if (data.password.length < 8) {
    throw new Error('Пароль должен содержать минимум 8 символов.')
  }
  if (!/[a-zA-Z]/.test(data.password)) {
    throw new Error('Пароль должен содержать минимум одну букву.')
  }
  if (!/[0-9]/.test(data.password)) {
    throw new Error('Пароль должен содержать минимум одну цифру.')
  }
  const passwordHash = await bcrypt.hash(data.password, 10)
  return createUser({
    login: data.login,
    fullName: data.fullName,
    passwordHash,
    role: data.role,
    isActive: data.isActive ?? true,
  })
}

export async function updateUserService(
  id: string,
  data: { fullName?: string; role?: UserRole; isActive?: boolean },
  currentUserId: string,
  currentUserRole: UserRole
) {
  const user = await getUserById(id)
  if (!user) {
    throw new Error('Пользователь не найден.')
  }

  // Нельзя изменять SUPERADMIN
  if (user.role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
    throw new Error('Нельзя изменять суперадминистратора.')
  }

  // Нельзя понижать роль SUPERADMIN
  if (user.role === 'SUPERADMIN' && data.role && data.role !== 'SUPERADMIN') {
    throw new Error('Нельзя изменить роль суперадминистратора.')
  }

  // Нельзя отключать последнего SUPERADMIN
  if (data.isActive === false && user.role === 'SUPERADMIN') {
    const superAdminCount = await getSuperAdminCount()
    if (superAdminCount <= 1) {
      throw new Error('Нельзя отключить последнего суперадминистратора.')
    }
  }

  // ADMIN не может создавать/назначать SUPERADMIN
  if (currentUserRole === 'ADMIN' && (data.role === 'SUPERADMIN' || user.role === 'SUPERADMIN')) {
    throw new Error('Недостаточно прав для работы с суперадминистратором.')
  }

  // ADMIN не может изменять других ADMIN
  if (currentUserRole === 'ADMIN' && user.role === 'ADMIN' && id !== currentUserId) {
    throw new Error('Недостаточно прав для редактирования администратора.')
  }

  return updateUser(id, data)
}

export async function changePasswordService(id: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error('Пароль должен содержать минимум 8 символов.')
  }
  if (!/[a-zA-Z]/.test(newPassword)) {
    throw new Error('Пароль должен содержать минимум одну букву.')
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new Error('Пароль должен содержать минимум одну цифру.')
  }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  const { prisma } = await import('@/lib/prisma')
  return prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function blockUserService(id: string, currentUserId: string, currentUserRole: UserRole) {
  if (id === currentUserId) {
    throw new Error('Нельзя заблокировать самого себя.')
  }
  const user = await getUserById(id)
  if (!user) {
    throw new Error('Пользователь не найден.')
  }
  if (user.role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
    throw new Error('Нельзя заблокировать суперадминистратора.')
  }
  if (user.role === 'SUPERADMIN') {
    const superAdminCount = await getSuperAdminCount()
    if (superAdminCount <= 1) {
      throw new Error('Нельзя заблокировать последнего суперадминистратора.')
    }
  }
  if (currentUserRole === 'ADMIN' && user.role === 'ADMIN') {
    throw new Error('Недостаточно прав для блокировки администратора.')
  }
  return blockUser(id)
}
