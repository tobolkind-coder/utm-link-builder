const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping.')
      return
    }

    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(f => f !== 'migration_lock.toml')
      .sort()

    for (const folder of migrationFolders) {
      const sqlPath = path.join(migrationsDir, folder, 'migration.sql')
      if (!fs.existsSync(sqlPath)) continue

      const sql = fs.readFileSync(sqlPath, 'utf-8')
      const statements = sql
        .split(';')
        .map(s => s.replace(/^--.*$/gm, '').trim())
        .filter(s => s.length > 0)

      for (const stmt of statements) {
        try {
          await client.query(stmt)
        } catch (err) {
          if (['42710', '42P07', '42P16', '42P01', '42701'].includes(err.code)) {
            continue
          }
          throw err
        }
      }

      console.log('Migration ' + folder + ' applied')
    }

    console.log('All migrations completed')

    // Seed data
    await seedData(client)
  } finally {
    await client.end()
  }
}

async function seedData(client) {
  const docsPath = path.join(__dirname, '..', 'docs')

  // Seed UTM Source
  const srcCount = await client.query('SELECT COUNT(*) as c FROM "UtmSource"')
  if (parseInt(srcCount.rows[0].c) === 0 && fs.existsSync(path.join(docsPath, 'utm_source.txt'))) {
    const lines = fs.readFileSync(path.join(docsPath, 'utm_source.txt'), 'utf-8').split('\n').filter(l => l.trim())
    for (let i = 0; i < lines.length; i++) {
      await client.query('INSERT INTO "UtmSource" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())',
        [crypto.randomUUID(), lines[i].trim(), i + 1])
    }
    console.log('Seeded UTM Source: ' + lines.length + ' items')
  }

  // Seed UTM Medium
  const medCount = await client.query('SELECT COUNT(*) as c FROM "UtmMedium"')
  if (parseInt(medCount.rows[0].c) === 0 && fs.existsSync(path.join(docsPath, 'utm_medium.txt'))) {
    const lines = fs.readFileSync(path.join(docsPath, 'utm_medium.txt'), 'utf-8').split('\n').filter(l => l.trim())
    for (let i = 0; i < lines.length; i++) {
      await client.query('INSERT INTO "UtmMedium" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())',
        [crypto.randomUUID(), lines[i].trim(), i + 1])
    }
    console.log('Seeded UTM Medium: ' + lines.length + ' items')
  }

  // Seed Campaign Part 1
  const cp1Count = await client.query('SELECT COUNT(*) as c FROM "UtmCampaignPart1"')
  if (parseInt(cp1Count.rows[0].c) === 0 && fs.existsSync(path.join(docsPath, 'utm_campaign_1.txt'))) {
    const lines = fs.readFileSync(path.join(docsPath, 'utm_campaign_1.txt'), 'utf-8').split('\n').filter(l => l.trim())
    for (let i = 0; i < lines.length; i++) {
      await client.query('INSERT INTO "UtmCampaignPart1" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())',
        [crypto.randomUUID(), lines[i].trim(), i + 1])
    }
    console.log('Seeded Campaign Part 1: ' + lines.length + ' items')
  }

  // Seed Campaign Part 2
  const cp2Count = await client.query('SELECT COUNT(*) as c FROM "UtmCampaignPart2"')
  if (parseInt(cp2Count.rows[0].c) === 0 && fs.existsSync(path.join(docsPath, 'utm_campaign_2.txt'))) {
    const lines = fs.readFileSync(path.join(docsPath, 'utm_campaign_2.txt'), 'utf-8').split('\n').filter(l => l.trim())
    for (let i = 0; i < lines.length; i++) {
      await client.query('INSERT INTO "UtmCampaignPart2" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())',
        [crypto.randomUUID(), lines[i].trim(), i + 1])
    }
    console.log('Seeded Campaign Part 2: ' + lines.length + ' items')
  }

  // Seed Settings
  const settingsCount = await client.query('SELECT COUNT(*) as c FROM "Settings"')
  if (parseInt(settingsCount.rows[0].c) === 0) {
    const shortDomain = process.env.SHORT_DOMAIN || 'go.company.ru'
    const customLoginPath = 'auth-' + crypto.randomBytes(8).toString('hex')
    await client.query(
      'INSERT INTO "Settings" ("id", "serviceName", "shortDomain", "customLoginPath", "loginAttemptsLimit", "loginBlockDuration", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [crypto.randomUUID(), 'UTM Link Builder', shortDomain, customLoginPath, 5, 300]
    )
    console.log('Seeded Settings')
    console.log('====================================================')
    console.log('  Login page path: /' + customLoginPath)
    console.log('  (change it in Admin > Settings if needed)')
    console.log('====================================================')
  }

  // Seed SuperAdmin user (bcrypt hash of "admin123" pre-computed)
  const adminCount = await client.query('SELECT COUNT(*) as c FROM "User"')
  if (parseInt(adminCount.rows[0].c) === 0) {
    const passwordHash = '$2b$10$V.aXlbyxKtbKHkhv4BctQ..Q2LwNcVNfIJlUTpuYEf3ZgMaE4aG.i'
    await client.query(
      'INSERT INTO "User" ("id", "login", "passwordHash", "fullName", "role", "isActive", "isDeleted", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())',
      [crypto.randomUUID(), 'admin', passwordHash, 'Администратор', 'SUPERADMIN']
    )
    console.log('Seeded SuperAdmin user (admin / admin123)')
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
