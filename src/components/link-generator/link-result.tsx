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
  const [copiedUtm, setCopiedUtm] = useState(false)
  const [copiedShort, setCopiedShort] = useState(false)

  if (!link) return null

  const handleCopy = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
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
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium">UTM-ссылка:</span>
            <p className="text-sm text-gray-600 break-all">{link.utmUrl}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => handleCopy(link.utmUrl, setCopiedUtm)}>
                {copiedUtm ? 'Скопировано!' : 'Копировать'}
              </Button>
              <Button variant="outline" onClick={() => window.open(link.utmUrl, '_blank')}>
                Открыть
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">Короткая ссылка:</span>
            <p className="text-sm text-gray-600">{link.shortUrl}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => handleCopy(link.shortUrl, setCopiedShort)}>
                {copiedShort ? 'Скопировано!' : 'Копировать'}
              </Button>
              <Button variant="outline" onClick={() => window.open(link.shortUrl, '_blank')}>
                Открыть
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
