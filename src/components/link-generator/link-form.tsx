'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectItem, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface UtmItem {
  id: string
  name: string
}

interface LinkFormProps {
  onSuccess: (link: { id: string; originalUrl: string; shortUrl: string; utmUrl: string; createdAt: string }) => void
}

export function LinkForm({ onSuccess }: LinkFormProps) {
  const [url, setUrl] = useState('')
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [campaignPart1, setCampaignPart1] = useState('')
  const [campaignPart2, setCampaignPart2] = useState('')
  const [contentDate, setContentDate] = useState(new Date().toISOString().slice(0, 10))
  const [contentText, setContentText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [useCustomCode, setUseCustomCode] = useState(false)
  const [customShortCode, setCustomShortCode] = useState('')
  const [codeCheckStatus, setCodeCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [codeCheckReason, setCodeCheckReason] = useState('')
  const [shortDomain, setShortDomain] = useState('')
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sources, setSources] = useState<UtmItem[]>([])
  const [mediums, setMediums] = useState<UtmItem[]>([])
  const [campaigns1, setCampaigns1] = useState<UtmItem[]>([])
  const [campaigns2, setCampaigns2] = useState<UtmItem[]>([])

  useEffect(() => {
    const fetchUtmData = async () => {
      try {
        const [sourcesRes, mediumsRes, campaigns1Res, campaigns2Res] = await Promise.all([
          fetch('/api/source'),
          fetch('/api/medium'),
          fetch('/api/campaign-part1'),
          fetch('/api/campaign-part2'),
        ])
        const [sourcesData, mediumsData, campaigns1Data, campaigns2Data] = await Promise.all([
          sourcesRes.json(),
          mediumsRes.json(),
          campaigns1Res.json(),
          campaigns2Res.json(),
        ])
        if (sourcesData.success) setSources(sourcesData.data)
        if (mediumsData.success) setMediums(mediumsData.data)
        if (campaigns1Data.success) setCampaigns1(campaigns1Data.data)
        if (campaigns2Data.success) setCampaigns2(campaigns2Data.data)
      } catch {
        toast.error('Ошибка загрузки справочников.')
      }
    }
    fetchUtmData()
  }, [])

  useEffect(() => {
    const fetchShortDomain = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success && data.data?.shortDomain) {
          setShortDomain(data.data.shortDomain)
        }
      } catch {
        // не критично — просто не показываем префикс домена
      }
    }
    fetchShortDomain()
  }, [])

  useEffect(() => {
    if (codeDebounceRef.current) {
      clearTimeout(codeDebounceRef.current)
    }
    if (!useCustomCode || customShortCode.trim() === '') {
      setCodeCheckStatus('idle')
      setCodeCheckReason('')
      return
    }
    setCodeCheckStatus('checking')
    codeDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-code?code=${encodeURIComponent(customShortCode)}`)
        const data = await res.json()
        if (data.success && data.data?.available) {
          setCodeCheckStatus('available')
          setCodeCheckReason('')
        } else {
          setCodeCheckStatus('unavailable')
          setCodeCheckReason(data.data?.reason || 'Адрес недоступен.')
        }
      } catch {
        setCodeCheckStatus('unavailable')
        setCodeCheckReason('Не удалось проверить адрес.')
      }
    }, 400)
  }, [useCustomCode, customShortCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          utmSource,
          utmMedium: utmMedium || undefined,
          campaignPart1: campaignPart1 || undefined,
          campaignPart2: campaignPart2 || undefined,
          contentDate,
          contentText: contentText || undefined,
          customShortCode: useCustomCode ? customShortCode : undefined,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        setError(data.message)
        return
      }
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(data.data.shortUrl)
        } else {
          const textArea = document.createElement('textarea')
          textArea.value = data.data.shortUrl
          textArea.style.position = 'fixed'
          textArea.style.left = '-9999px'
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        }
        toast.success('Ссылка скопирована в буфер обмена.')
      } catch {
        toast.success('Ссылка успешно создана.')
      }
      onSuccess(data.data)
      setUrl('')
      setContentText('')
      setContentDate(new Date().toISOString().slice(0, 10))
      setUseCustomCode(false)
      setCustomShortCode('')
      setCodeCheckStatus('idle')
      setCodeCheckReason('')
    } catch {
      setError('Ошибка создания ссылки.')
    } finally {
      setLoading(false)
    }
  }

  const isValid =
    url.trim() !== '' &&
    utmSource !== '' &&
    (!useCustomCode || codeCheckStatus === 'available')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создать ссылку</CardTitle>
        <p className="text-xs text-gray-500 mt-1">* — обязательные поля для заполнения</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-1">URL *</label>
            <Input id="url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Вставьте ссылку" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium mb-1">UTM Source *</label>
              <Select value={utmSource} onValueChange={setUtmSource}>
                <SelectValue placeholder="Выберите источник" />
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="medium" className="block text-sm font-medium mb-1">UTM Medium</label>
              <Select value={utmMedium} onValueChange={setUtmMedium}>
                <SelectValue placeholder="Выберите тип" />
                {mediums.map((medium) => (
                  <SelectItem key={medium.id} value={medium.name}>{medium.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign1" className="block text-sm font-medium mb-1">Campaign Part 1</label>
              <Select value={campaignPart1} onValueChange={setCampaignPart1}>
                <SelectValue placeholder="Выберите" />
                {campaigns1.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="campaign2" className="block text-sm font-medium mb-1">Campaign Part 2</label>
              <Select value={campaignPart2} onValueChange={setCampaignPart2}>
                <SelectValue placeholder="Выберите" />
                {campaigns2.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contentDate" className="block text-sm font-medium mb-1">Дата UTM Content</label>
              <div className="relative">
                <Input
                  ref={dateInputRef}
                  id="contentDate"
                  type="date"
                  value={contentDate}
                  onChange={(e) => setContentDate(e.target.value)}
                  onClick={() => dateInputRef.current?.showPicker?.()}
                />
                {contentDate && (
                  <button
                    type="button"
                    onClick={() => setContentDate('')}
                    className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="contentText" className="block text-sm font-medium mb-1">Текст UTM Content</label>
              <Input id="contentText" type="text" value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Введите значение" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="customCodeSwitch" className="text-sm font-medium">
                Задать свой адрес короткой ссылки
              </label>
              <Switch
                id="customCodeSwitch"
                checked={useCustomCode}
                onCheckedChange={(checked) => {
                  setUseCustomCode(checked)
                  if (!checked) {
                    setCustomShortCode('')
                    setCodeCheckStatus('idle')
                    setCodeCheckReason('')
                  }
                }}
              />
            </div>
            {useCustomCode && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">{shortDomain}/</span>
                  <Input
                    type="text"
                    value={customShortCode}
                    onChange={(e) => setCustomShortCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 9))}
                    placeholder="ivan_blogger"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Латиница, цифры, «-» и «_», 3-9 символов. Регистр не различается.
                </p>
                {codeCheckStatus === 'checking' && <p className="text-xs text-gray-400">Проверка...</p>}
                {codeCheckStatus === 'available' && <p className="text-xs text-green-600">✓ Адрес свободен</p>}
                {codeCheckStatus === 'unavailable' && <p className="text-xs text-red-600">{codeCheckReason}</p>}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!isValid || loading}>
            {loading ? 'Создание...' : 'Создать ссылку'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
