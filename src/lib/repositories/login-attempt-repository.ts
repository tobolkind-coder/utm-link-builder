import { prisma } from '@/lib/prisma'

export async function findAttempt(identifier: string) {
  return prisma.loginAttempt.findFirst({ where: { identifier } })
}

export async function upsertAttempt(
  identifier: string,
  data: { attempts: number; lastAttempt: Date; blockedUntil: Date | null }
) {
  const existing = await findAttempt(identifier)
  if (existing) {
    return prisma.loginAttempt.update({
      where: { id: existing.id },
      data,
    })
  }
  return prisma.loginAttempt.create({
    data: { identifier, ...data },
  })
}

export async function resetAttempt(identifier: string) {
  const existing = await findAttempt(identifier)
  if (existing) {
    await prisma.loginAttempt.delete({ where: { id: existing.id } })
  }
}

export async function cleanupOldAttempts(olderThanMs: number) {
  const cutoff = new Date(Date.now() - olderThanMs)
  await prisma.loginAttempt.deleteMany({
    where: {
      lastAttempt: { lt: cutoff },
      blockedUntil: null,
    },
  })
}
