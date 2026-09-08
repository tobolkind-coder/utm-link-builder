import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/lib/auth'

export interface CreateUserData {
  login: string
  fullName: string
  passwordHash: string
  role: UserRole
  isActive?: boolean
}

export interface UpdateUserData {
  fullName?: string
  role?: UserRole
  isActive?: boolean
}

export async function getUsers(includeDeleted: boolean = false) {
  return prisma.user.findMany({
    where: includeDeleted ? {} : { isDeleted: false },
    select: {
      id: true,
      login: true,
      fullName: true,
      role: true,
      isActive: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      login: true,
      fullName: true,
      role: true,
      isActive: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getUserByLogin(login: string) {
  return prisma.user.findUnique({ where: { login } })
}

export async function createUser(data: CreateUserData) {
  return prisma.user.create({ data })
}

export async function updateUser(id: string, data: UpdateUserData) {
  return prisma.user.update({ where: { id }, data })
}

export async function blockUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
    },
  })
}

export async function restoreUser(id: string, isActive: boolean) {
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: false,
      isActive,
      deletedAt: null,
    },
  })
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function getSuperAdminCount() {
  return prisma.user.count({
    where: {
      role: 'SUPERADMIN',
      isDeleted: false,
    },
  })
}
