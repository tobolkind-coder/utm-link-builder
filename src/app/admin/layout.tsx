'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'

interface UserData {
  fullName: string
  role: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!data.success || !['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(data.data.role)) {
          router.push('/')
          return
        }
        setUser(data.data)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const canManageUsers = ['ADMIN', 'SUPERADMIN'].includes(user.role)
  const canManageDictionaries = ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(user.role)
  const canManageSettings = ['ADMIN', 'SUPERADMIN'].includes(user.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="flex gap-4">
            {canManageDictionaries && (
              <Link href="/admin/dictionaries" className={`px-4 py-2 rounded ${pathname === '/admin/dictionaries' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Справочники</Link>
            )}
            {canManageUsers && (
              <Link href="/admin/users" className={`px-4 py-2 rounded ${pathname === '/admin/users' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Пользователи</Link>
            )}
            {canManageSettings && (
              <Link href="/admin/settings" className={`px-4 py-2 rounded ${pathname === '/admin/settings' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Настройки</Link>
            )}
          </nav>
        </div>
        {children}
      </main>
    </div>
  )
}
