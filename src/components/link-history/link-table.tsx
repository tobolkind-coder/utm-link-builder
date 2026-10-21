'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Link {
  id: string
  shortUrl: string
  utmUrl: string
  createdAt: string
}

interface LinkTableProps {
  refreshSignal: number
}

interface Meta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function LinkTable({ refreshSignal }: LinkTableProps) {
  const [links, setLinks] = useState<Link[]>([])
  const [meta, setMeta] = useState<Meta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [utmUrl, setUtmUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(meta.pageSize))
      if (search) params.set('search', search)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/links?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setLinks(data.data)
        setMeta(data.meta)
      } else {
        toast.error(data.message || 'Ошибка загрузки истории.')
      }
    } catch {
      toast.error('Ошибка загрузки истории.')
    } finally {
      setLoading(false)
    }
  }, [page, meta.pageSize, search, dateFrom, dateTo])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks, refreshSignal])

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchInput])

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    setPage(1)
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    toast.success('Ссылка скопирована.')
  }

  const openEdit = (link: Link) => {
    setEditingLink(link)
    setUtmUrl(link.utmUrl)
    setError('')
  }

  const closeEdit = () => {
    setEditingLink(null)
    setUtmUrl('')
    setError('')
  }

  const handleSave = async () => {
    if (!editingLink) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utmUrl }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
        return
      }
      toast.success('Ссылка обновлена.')
      closeEdit()
      fetchLinks()
    } catch {
      setError('Ошибка сохранения.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const startIdx = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1
  const endIdx = Math.min(meta.page * meta.pageSize, meta.total)

  return (
    <Card className="mt-6 relative">
      <CardHeader>
        <CardTitle>История ссылок</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по ссылке или короткой ссылке"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium mb-1">Дата от</label>
              <Input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium mb-1">Дата до</label>
              <Input type="date" value={dateTo} onChange={(e) => handleDateToChange(e.target.value)} />
            </div>
            <Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-4">Загрузка...</p>
        ) : links.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Вы еще не создали ни одной ссылки.</p>
        ) : (
          <>
            <div className="divide-y">
              <div className="grid grid-cols-[110px_1fr] gap-x-4 pb-2 text-xs font-medium text-gray-500 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span>Дата</span>
                <span>Ссылки</span>
              </div>
              {links.map((link) => (
                <div key={link.id} className="grid grid-cols-[110px_1fr] gap-x-4 py-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <span className="text-xs text-gray-500 whitespace-nowrap pt-1">{formatDate(link.createdAt)}</span>
                  <div className="space-y-1.5 min-w-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-2">
                      <span className="font-mono text-xs truncate min-w-0" title={link.shortUrl}>{link.shortUrl}</span>
                      <Button size="sm" className="w-full" onClick={() => handleCopy(link.shortUrl)}>Копировать</Button>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-2">
                      <p className="text-xs text-gray-500 truncate min-w-0" title={link.utmUrl}>{link.utmUrl}</p>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => openEdit(link)}>Редактировать</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {startIdx}–{endIdx} из {meta.total}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={meta.page === 1} onClick={() => setPage(meta.page - 1)}>
                    Назад
                  </Button>
                  <Button variant="outline" size="sm" disabled={meta.page === meta.totalPages} onClick={() => setPage(meta.page + 1)}>
                    Далее
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={editingLink !== null} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать ссылку</DialogTitle>
            <DialogDescription>
              Измените UTM-ссылку. Короткая ссылка останется прежней:{' '}
              <span className="font-mono text-xs break-all">{editingLink?.shortUrl}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-sm font-medium">UTM-ссылка *</label>
            <Input
              type="text"
              value={utmUrl}
              onChange={(e) => setUtmUrl(e.target.value)}
              placeholder="https://site.ru/page?utm_source=..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEdit}>Отмена</Button>
            <Button type="button" onClick={handleSave} disabled={saving || utmUrl.trim() === ''}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
