import { notFound } from 'next/navigation'

/**
 * Корневой маршрут не используется для входа в систему.
 * URL страницы авторизации является уникальным и настраиваемым (см. Settings.customLoginPath),
 * известен только пользователям сервиса и не должен быть обнаружен через корень домена.
 */
export default function RootPage() {
  notFound()
}
