'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Link {
  id: string
  shortUrl: string
  utmUrl: string
  createdAt: string
}

interface LinkTableProps {
  links: Link[]
}

const ITEMS_PER_PAGE = 10

export function LinkTable({ links }: LinkTableProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE)
  const startIdx = (page - 1) * ITEMS_PER_PAGE
  const pageLinks = links.slice(startIdx, startIdx + ITEMS_PER_PAGE)

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

  return (
    <Card className="mt-6 relative">
      <CardHeader>
        <CardTitle>История ссылок (последние 50)</CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Вы еще не создали ни одной ссылки.</p>
        ) : (
          <>
            <div className="divide-y">
              <div className="grid grid-cols-[110px_1fr] gap-x-4 pb-2 text-xs font-medium text-gray-500 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span>Дата</span>
                <span>Ссылки</span>
              </div>
              {pageLinks.map((link) => (
                <div key={link.id} className="grid grid-cols-[110px_1fr] gap-x-4 py-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <span className="text-xs text-gray-500 whitespace-nowrap pt-1">{formatDate(link.createdAt)}</span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs break-all min-w-0">{link.shortUrl}</span>
                      <Button size="sm" className="shrink-0" onClick={() => handleCopy(link.shortUrl)}>Копировать</Button>
                    </div>
                    <p className="text-xs text-gray-500 break-all">{link.utmUrl}</p>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, links.length)} из {links.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Назад
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    Далее
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
