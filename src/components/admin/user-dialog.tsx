'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  login: string
  fullName: string
  role: string
  isActive: boolean
}

interface UserDialogProps {
  open: boolean
  mode: 'create' | 'edit' | 'password'
  user: User | null
  onClose: () => void
  onSuccess: () => void
  currentUserRole: string
}

const ROLES = [
  { value: 'USER', label: 'Пользователь', desc: 'Создание ссылок, просмотр истории' },
  { value: 'EDITOR', label: 'Редактор', desc: 'USER + управление справочниками' },
  { value: 'ADMIN', label: 'Администратор', desc: 'EDITOR + управление пользователями (USER, EDITOR)' },
  { value: 'SUPERADMIN', label: 'Суперадминистратор', desc: 'Полный доступ' },
]

export function UserDialog({ open, mode, user, onClose, onSuccess, currentUserRole }: UserDialogProps) {
  const [login, setLogin] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('USER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableRoles = currentUserRole === 'SUPERADMIN'
    ? ROLES
    : ROLES.filter(r => r.value !== 'SUPERADMIN' && r.value !== 'ADMIN')

  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'password')) {
      setFullName(user.fullName)
      setRole(user.role)
    } else {
      setLogin('')
      setFullName('')
      setPassword('')
      setConfirmPassword('')
      setRole('USER')
    }
  }, [user, mode, open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res: Response
      if (mode === 'create') {
        if (password !== confirmPassword) { setError('Пароли не совпадают.'); setLoading(false); return }
        res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, fullName, password, role }) })
      } else if (mode === 'edit') {
        res = await fetch(`/api/users/${user?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, role }) })
      } else {
        if (password !== confirmPassword) { setError('Пароли не совпадают.'); setLoading(false); return }
        res = await fetch(`/api/users/${user?.id}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      }
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      onSuccess()
    } catch {
      setError('Ошибка сохранения.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          {mode === 'create' && 'Создать пользователя'}
          {mode === 'edit' && 'Редактировать пользователя'}
          {mode === 'password' && 'Сменить пароль'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Логин *</label>
                <Input value={login} onChange={(e) => setLogin(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Роль *</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded px-3 py-2">
                  {availableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {ROLES.find(r => r.value === role)?.desc}
                </p>
              </div>
            </>
          )}
          {mode !== 'password' && (
            <div>
              <label className="block text-sm font-medium mb-1">Полное имя *</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          {(mode === 'create' || mode === 'password') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{mode === 'create' ? 'Пароль *' : 'Новый пароль *'}</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Подтверждение *</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </>
          )}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium mb-1">Роль *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded px-3 py-2">
                {availableRoles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {ROLES.find(r => r.value === role)?.desc}
              </p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
