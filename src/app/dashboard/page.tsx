'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { LinkForm } from '@/components/link-generator/link-form'
import { LinkResult } from '@/components/link-generator/link-result'
import { LinkTable } from '@/components/link-history/link-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from 'sonner'

interface User {
  id: string
  login: string
  fullName: string
  role: string
}

interface Link {
  id: string
  originalUrl: string
  shortUrl: string
  utmUrl: string
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [lastCreatedLink, setLastCreatedLink] = useState<Link | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchLinks = useCallback(async () => {
    try {
      const linksRes = await fetch('/api/links')
      const linksData = await linksRes.json()
      if (linksData.success) {
        setLinks(linksData.data)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes] = await Promise.all([
          fetch('/api/auth/me'),
        ])
        const userData = await userRes.json()
        if (!userData.success) {
          router.push('/')
          return
        }
        setUser(userData.data)
        await fetchLinks()
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router, fetchLinks])

  const handleLinkSuccess = (link: Link) => {
    setLastCreatedLink(link)
    fetchLinks()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <LinkForm onSuccess={handleLinkSuccess} />
        <LinkResult link={lastCreatedLink} />
        <LinkTable links={links} onUpdated={fetchLinks} />
      </main>
    </div>
  )
}
