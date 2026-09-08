'use client'

import { Button } from '@/components/ui/button'

interface User {
  id: string
  login: string
  fullName: string
  role: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
}

interface UserTableProps {
  users: User[]
  currentUserId: string
  currentUserRole: string
  onEdit: (user: User) => void
  onChangePassword: (user: User) => void
  onBlock: (userId: string) => void
  onRestore: (userId: string) => void
  onToggleActive: (userId: string, isActive: boolean) => void
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  EDITOR: 'Редактор',
  ADMIN: 'Администратор',
  SUPERADMIN: 'Суперадминистратор',
}

export function UserTable({ users, currentUserId, currentUserRole, onEdit, onChangePassword, onBlock, onRestore, onToggleActive }: UserTableProps) {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU')

  const canEditUser = (user: User) => {
    if (currentUserRole === 'SUPERADMIN') return true
    if (currentUserRole === 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') return true
    return false
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Логин</th>
            <th className="text-left py-2">Полное имя</th>
            <th className="text-left py-2">Роль</th>
            <th className="text-left py-2">Статус</th>
            <th className="text-left py-2">Дата создания</th>
            <th className="text-left py-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={`border-b ${user.isDeleted ? 'bg-gray-50 text-gray-400' : ''}`}>
              <td className="py-2">{user.login}</td>
              <td className="py-2">{user.fullName}</td>
              <td className="py-2">{ROLE_LABELS[user.role] || user.role}</td>
              <td className="py-2">
                {user.isDeleted ? (
                  <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Заблокирован</span>
                ) : (
                  <button
                    onClick={() => canEditUser(user) && onToggleActive(user.id, !user.isActive)}
                    disabled={!canEditUser(user)}
                    className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </button>
                )}
              </td>
              <td className="py-2">{formatDate(user.createdAt)}</td>
              <td className="py-2">
                {canEditUser(user) && (
                  <div className="flex gap-2">
                    {user.isDeleted ? (
                      <Button variant="outline" size="sm" onClick={() => onRestore(user.id)}>Восстановить</Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onEdit(user)}>Редактировать</Button>
                        <Button variant="outline" size="sm" onClick={() => onChangePassword(user)}>Сменить пароль</Button>
                        {user.id !== currentUserId && (
                          <Button variant="destructive" size="sm" onClick={() => onBlock(user.id)}>Заблокировать</Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
