'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [serviceName, setServiceName] = useState('')
  const [shortDomain, setShortDomain] = useState('')
  const [instructionUrl, setInstructionUrl] = useState('')
  const [customLoginPath, setCustomLoginPath] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)

    const fetchData = async () => {
      try {
        const [settingsRes, meRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/auth/me'),
        ])
        const settingsData = await settingsRes.json()
        const meData = await meRes.json()

        if (!meData.success || !['ADMIN', 'SUPERADMIN'].includes(meData.data.role)) {
          router.push('/admin/dictionaries')
          return
        }

        if (settingsData.success) {
          setServiceName(settingsData.data.serviceName)
          setShortDomain(settingsData.data.shortDomain)
          setInstructionUrl(settingsData.data.instructionUrl || '')
          setCustomLoginPath(settingsData.data.customLoginPath || '')
        }
        if (meData.success && meData.data.role === 'SUPERADMIN') {
          setIsSuperAdmin(true)
        }
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [router])

  const handleGeneratePath = () => {
    const randomPart = Array.from({ length: 16 }, () =>
      '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]
    ).join('')
    setCustomLoginPath(`auth-${randomPart}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSuperAdmin && customLoginPath) {
      const normalized = customLoginPath.replace(/^\/+|\/+$/g, '')
      if (!/^[a-z0-9-]{10,50}$/.test(normalized)) {
        toast.error('Путь входа: только латинские буквы, цифры и дефис, длина 10-50 символов.')
        return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, string> = { serviceName, instructionUrl }
      if (isSuperAdmin) {
        payload.customLoginPath = customLoginPath.replace(/^\/+|\/+$/g, '')
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Настройки сохранены.')
        if (data.data.customLoginPath) setCustomLoginPath(data.data.customLoginPath)
      } else {
        toast.error(data.message || 'Не удалось сохранить настройки.')
      }
    } catch { /* empty */ }
    finally { setSaving(false) }
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Настройки</h2>
      <Card>
        <CardHeader><CardTitle>Общие настройки</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuperAdmin && (
              <div><label className="block text-sm font-medium mb-1">Название сервиса</label><Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} /></div>
            )}
            <div><label className="block text-sm font-medium mb-1">Ссылка на памятку</label><Input value={instructionUrl} onChange={(e) => setInstructionUrl(e.target.value)} placeholder="https://docs.google.com/..." /></div>

            {isSuperAdmin && (
              <div className="border-t pt-4 space-y-2">
                <label className="block text-sm font-medium mb-1">Путь входа в систему (только SUPERADMIN)</label>
                <div className="flex gap-2">
                  <Input
                    value={customLoginPath}
                    onChange={(e) => setCustomLoginPath(e.target.value)}
                    placeholder="auth-xxxxxxxxxxxxxxxx"
                  />
                  <Button type="button" variant="outline" onClick={handleGeneratePath}>
                    Сгенерировать
                  </Button>
                </div>
                {customLoginPath && origin && (
                  <p className="text-sm text-gray-500 break-all">
                    Текущий адрес входа: {origin}/{customLoginPath.replace(/^\/+/, '')}
                  </p>
                )}
                <p className="text-xs text-amber-600">
                  Внимание: после сохранения старая ссылка для входа перестанет работать. Сообщите новый адрес всем пользователям сервиса самостоятельно.
                </p>
              </div>
            )}

            <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
