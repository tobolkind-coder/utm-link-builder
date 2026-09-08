import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware безопасности:
 * 1. Добавляет заголовок X-Robots-Tag: noindex, nofollow ко всем страницам приложения,
 *    кроме коротких ссылок (/[shortCode]) — они должны редиректить без индексации самой
 *    страницы редиректа поисковыми системами, но не мешать работе шаринга/редиректа.
 * 2. Для /admin/* без сессии — возвращает 404 (не редирект на страницу входа),
 *    чтобы не раскрывать существование раздела администрирования.
 *
 * Полноценная проверка прав (роль пользователя) остаётся на уровне layout/API —
 * здесь проверяется только наличие cookie сессии (быстрая проверка без обращения к БД).
 */

const STATIC_PATH_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/api', // API не должен индексироваться, но не должен получать 404 при отсутствии сессии здесь
]

function isShortCodeCandidate(pathname: string): boolean {
  // короткие ссылки — это одиночный сегмент вида /AbC123 длиной 6-8 символов
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return false
  return /^[a-zA-Z0-9]{6,8}$/.test(segments[0])
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаем статику и служебные пути без изменений
  if (STATIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Защита раздела администрирования: без сессии — 404 (не редирект)
  // Rewrite на заведомо несуществующий путь заставляет Next.js отрендерить
  // страницу not-found.tsx с кодом состояния 404, не раскрывая факт существования /admin.
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) {
      return NextResponse.rewrite(new URL('/__404__', request.url))
    }
  }


  const response = NextResponse.next()

  // Короткие ссылки не получают X-Robots-Tag, чтобы не мешать редиректу/шарингу
  if (!isShortCodeCandidate(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем путям, кроме:
     * - _next/static, _next/image (статика Next.js)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
