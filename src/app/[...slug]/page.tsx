import { notFound, redirect } from 'next/navigation'
import { getCurrentLoginPath } from '@/lib/services/settings-service'
import { LoginForm } from '@/components/auth/login-form'
import { findLinkByShortCode } from '@/lib/repositories/link-repository'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

/**
 * Catch-all route для обработки кастомного URL входа и коротких ссылок.
 */
export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params
  const currentPath = slug.join('/')
  const loginPath = await getCurrentLoginPath()

  if (currentPath === loginPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    )
  }

  if (slug.length === 1 && /^[a-zA-Z0-9]{6,8}$/.test(slug[0])) {
    const link = await findLinkByShortCode(slug[0])
    if (link) {
      redirect(link.utmUrl)
    }
  }

  notFound()
}
