import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export type UserRole = 'USER' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN'

export interface AuthUser {
  id: string
  login: string
  fullName: string
  role: UserRole
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  EDITOR: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

export function hasRole(user: AuthUser, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]
}

export async function authenticateUser(login: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { login },
    select: {
      id: true,
      login: true,
      fullName: true,
      passwordHash: true,
      role: true,
      isActive: true,
      isDeleted: true,
    },
  })

  if (!user || !user.isActive || user.isDeleted) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    role: user.role,
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value

  if (!sessionToken) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionToken },
    select: {
      id: true,
      login: true,
      fullName: true,
      role: true,
      isActive: true,
      isDeleted: true,
    },
  })

  if (!user || !user.isActive || user.isDeleted) {
    return null
  }

  return {
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    role: user.role,
  }
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
