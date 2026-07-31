'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LinkResultProps {
  link: {
    originalUrl: string
    utmUrl: string
    shortUrl: string
  } | null
}

export function LinkResult({ link }: LinkResultProps) {
  const [copied, setCopied] = useState(false)

  if (!link) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = link.shortUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">UTM-ссылка:</span>
            <p className="text-sm text-gray-600 break-all">{link.utmUrl}</p>
          </div>
          <div>
            <span className="text-sm font-medium">Короткая ссылка:</span>
            <p className="text-sm text-gray-600">{link.shortUrl}</p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? 'Скопировано!' : 'Копировать'}
            </Button>
            <Button variant="outline" onClick={() => window.open(link.shortUrl, '_blank')}>
              Открыть
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
