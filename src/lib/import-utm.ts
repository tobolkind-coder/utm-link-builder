import { prisma } from './prisma'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

async function importFromFile(
  filePath: string,
  createFn: (name: string, sortOrder: number) => Promise<void>
): Promise<number> {
  if (!existsSync(filePath)) {
    return 0
  }
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim() !== '')
  let count = 0

  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim()
    if (name) {
      await createFn(name, i + 1)
      count++
    }
  }

  return count
}

function getDocsPath(): string {
  const cwd = process.cwd()
  if (existsSync(join(cwd, 'docs', 'utm_source.txt'))) {
    return join(cwd, 'docs')
  }
  if (existsSync(join(cwd, 'app', 'docs', 'utm_source.txt'))) {
    return join(cwd, 'app', 'docs')
  }
  return join(cwd, 'docs')
}

export async function importUtmData(): Promise<void> {
  const docsPath = getDocsPath()

  const sourceCount = await prisma.utmSource.count()
  if (sourceCount === 0) {
    await importFromFile(join(docsPath, 'utm_source.txt'), async (name, sortOrder) => {
      await prisma.utmSource.create({ data: { name, sortOrder } })
    })
  }

  const mediumCount = await prisma.utmMedium.count()
  if (mediumCount === 0) {
    await importFromFile(join(docsPath, 'utm_medium.txt'), async (name, sortOrder) => {
      await prisma.utmMedium.create({ data: { name, sortOrder } })
    })
  }

  const campaign1Count = await prisma.utmCampaignPart1.count()
  if (campaign1Count === 0) {
    await importFromFile(join(docsPath, 'utm_campaign_1.txt'), async (name, sortOrder) => {
      await prisma.utmCampaignPart1.create({ data: { name, sortOrder } })
    })
  }

  const campaign2Count = await prisma.utmCampaignPart2.count()
  if (campaign2Count === 0) {
    await importFromFile(join(docsPath, 'utm_campaign_2.txt'), async (name, sortOrder) => {
      await prisma.utmCampaignPart2.create({ data: { name, sortOrder } })
    })
  }

  const settingsCount = await prisma.settings.count()
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        serviceName: 'UTM Link Builder',
        shortDomain: 'go.company.ru',
      },
    })
  }

  const adminCount = await prisma.user.count()
  if (adminCount === 0) {
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        login: 'admin',
        passwordHash,
        fullName: 'Администратор',
        role: 'ADMIN',
      },
    })
  }
}
