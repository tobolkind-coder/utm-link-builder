'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserTable } from '@/components/admin/user-table'
import { UserDialog } from '@/components/admin/user-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface User {
  id: string
  login: string
  fullName: string
  role: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'password'>('create')
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?includeDeleted=true')
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.success) {
        if (!['ADMIN', 'SUPERADMIN'].includes(d.data.role)) {
          router.push('/admin/dictionaries')
          return
        }
        setCurrentUser({ id: d.data.id, role: d.data.role })
      }
    }).catch(() => {})
    fetchUsers()
  }, [router])

  const filteredUsers = showBlocked ? users : users.filter(u => !u.isDeleted)

  const handleCreate = () => { setSelectedUser(null); setDialogMode('create'); setDialogOpen(true) }
  const handleEdit = (user: User) => { setSelectedUser(user); setDialogMode('edit'); setDialogOpen(true) }
  const handleChangePassword = (user: User) => { setSelectedUser(user); setDialogMode('password'); setDialogOpen(true) }
  const handleBlock = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Пользователь заблокирован.'); fetchUsers() }
    else { toast.error(data.message) }
  }
  const handleRestore = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDeleted: false, isActive: true }) })
    const data = await res.json()
    if (data.success) { toast.success('Пользователь восстановлен.'); fetchUsers() }
    else { toast.error(data.message) }
  }
  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })
    fetchUsers()
  }
  const handleDialogClose = () => { setDialogOpen(false); setSelectedUser(null) }
  const handleDialogSuccess = () => { handleDialogClose(); toast.success(dialogMode === 'create' ? 'Пользователь создан.' : 'Изменения сохранены.'); fetchUsers() }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Пользователи</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showBlocked} onChange={(e) => setShowBlocked(e.target.checked)} className="rounded" />
            Показать заблокированных
          </label>
        </div>
        {currentUser && ['ADMIN', 'SUPERADMIN'].includes(currentUser.role) && (
          <Button onClick={handleCreate}>Создать пользователя</Button>
        )}
      </div>
      <UserTable
        users={filteredUsers}
        currentUserId={currentUser?.id || ''}
        currentUserRole={currentUser?.role || ''}
        onEdit={handleEdit}
        onChangePassword={handleChangePassword}
        onBlock={handleBlock}
        onRestore={handleRestore}
        onToggleActive={handleToggleActive}
      />
      <UserDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        currentUserRole={currentUser?.role || ''}
      />
    </div>
  )
}
