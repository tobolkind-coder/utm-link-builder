'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user: {
    fullName: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const [serviceName, setServiceName] = useState('UTM Link Builder')
  const [instructionUrl, setInstructionUrl] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.data.serviceName) setServiceName(d.data.serviceName)
          if (d.data.instructionUrl) setInstructionUrl(d.data.instructionUrl)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    const data = await res.json().catch(() => null)
    router.push(data?.data?.loginPath || '/')
    router.refresh()
  }


  const canAccessAdmin = ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(user.role)

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold hover:text-blue-600 transition-colors">{serviceName}</Link>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              На главную
            </Button>
          )}

          {instructionUrl && (
            <Button variant="outline" onClick={() => window.open(instructionUrl, '_blank')}>
              Памятка
            </Button>
          )}
          <span className="text-sm text-gray-600">{user.fullName}</span>
          {!isAdmin && canAccessAdmin && (
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Администрирование
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            Выход
          </Button>
        </div>
      </div>
    </header>
  )
}
