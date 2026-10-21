'use client'

import { useState, useEffect } from 'react'
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
  comment?: string | null
  isFavorite?: boolean
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [lastCreatedLink, setLastCreatedLink] = useState<Link | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        const userData = await userRes.json()
        if (!userData.success) {
          router.push('/')
          return
        }
        setUser(userData.data)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleLinkSuccess = (link: Link) => {
    setLastCreatedLink(link)
    setRefreshSignal((prev) => prev + 1)
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
        <LinkTable refreshSignal={refreshSignal} />
      </main>
    </div>
  )
}
