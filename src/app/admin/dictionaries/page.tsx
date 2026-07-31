'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DictionaryItem {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

const DICTIONARY_TABS = [
  { id: 'source', label: 'UTM Source', api: 'source' },
  { id: 'medium', label: 'UTM Medium', api: 'medium' },
  { id: 'campaign-part1', label: 'Campaign Part 1', api: 'campaign-part1' },
  { id: 'campaign-part2', label: 'Campaign Part 2', api: 'campaign-part2' },
]

export default function DictionariesPage() {
  const [activeTab, setActiveTab] = useState('source')
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DictionaryItem | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  const fetchItems = useCallback(async (api: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/${api}?includeInactive=true`)
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch { console.error('Failed to fetch items') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const tab = DICTIONARY_TABS.find(t => t.id === activeTab)
    if (tab) fetchItems(tab.api)
  }, [activeTab, fetchItems])

  const handleCreate = () => { setSelectedItem(null); setName(''); setSortOrder(0); setDialogOpen(true) }
  const handleEdit = (item: DictionaryItem) => { setSelectedItem(item); setName(item.name); setSortOrder(item.sortOrder); setDialogOpen(true) }
  const handleToggleActive = async (itemId: string, isActive: boolean) => { await fetch(`/api/${activeTab}/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); fetchItems(activeTab) }
  const handleDisable = async (item: DictionaryItem) => {
    if (!confirm(`Отключить элемент "${item.name}"? Он больше не будет отображаться в списке для выбора на главной странице.`)) return
    await fetch(`/api/${activeTab}/${item.id}`, { method: 'DELETE' })
    fetchItems(activeTab)
  }

  const handleSave = async () => {
    const url = selectedItem ? `/api/${activeTab}/${selectedItem.id}` : `/api/${activeTab}`
    const method = selectedItem ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, sortOrder }) })
    setDialogOpen(false)
    fetchItems(activeTab)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {DICTIONARY_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white'}`}>{tab.label}</button>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Справочники</h2>
        <Button onClick={handleCreate}>Добавить</Button>
      </div>
      {loading ? (
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Название</th>
              <th className="text-left py-2">Порядок</th>
              <th className="text-left py-2">Активность</th>
              <th className="text-left py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.sortOrder}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Активен' : 'Неактивен'}</span>
                </td>
                <td className="py-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Редактировать</Button>
                  {item.isActive ? (
                    <Button variant="destructive" size="sm" onClick={() => handleDisable(item)}>Отключить</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(item.id, true)}>Включить</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{selectedItem ? 'Редактировать' : 'Добавить'} элемент</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Название *</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><label className="block text-sm font-medium mb-1">Порядок</label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                <Button onClick={handleSave}>Сохранить</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
