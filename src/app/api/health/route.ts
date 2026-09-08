import { NextResponse } from 'next/server'

/**
 * Liveness-проба для healthcheck контейнера.
 *
 * Намеренно не обращается к БД: кратковременная недоступность Postgres не должна
 * помечать работающее приложение как unhealthy. Готовность базы проверяет
 * собственный healthcheck сервиса db.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
