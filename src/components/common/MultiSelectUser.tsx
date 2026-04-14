import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { ApiService } from '../../services/common/apiService'

interface GraphUser {
  id: string
  displayName: string
  mail: string | null
  mobilePhone: string | null
}

export interface SelectedUser {
  id: string
  name: string
  email: string
  phone: string
}

interface MultiSelectUserProps {
  placeholder?: string
  selectedUsers: SelectedUser[]
  onChange: (users: SelectedUser[]) => void
}

export function MultiSelectUser({
  placeholder = 'Select users...',
  selectedUsers,
  onChange,
}: MultiSelectUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<GraphUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen || hasFetched.current) return
    hasFetched.current = true
    // Defer state update to next tick to avoid cascading render warning
    const timer = setTimeout(() => setIsLoading(true), 0)
    ApiService.get<{ value: GraphUser[] }>(
      'https://graph.microsoft.com/v1.0/users?$select=displayName,id,mail,mobilePhone&$top=100'
    )
      .then(data => setUsers(data.value || []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
    return () => clearTimeout(timer)
  }, [isOpen])

  const filtered = users.filter(
    u =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (u.mail || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (user: GraphUser) => {
    const exists = selectedUsers.some(s => s.id === user.id)
    if (exists) {
      onChange(selectedUsers.filter(s => s.id !== user.id))
    } else {
      onChange([
        ...selectedUsers,
        {
          id: user.id,
          name: user.displayName,
          email: user.mail || '',
          phone: user.mobilePhone || '',
        },
      ])
    }
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedUsers.filter(s => s.id !== id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 bg-surface border rounded-lg text-[13px] text-left transition-all ${
          isOpen ? 'border-secondary-text ring-2 ring-accent/5' : 'border-border-main hover:border-secondary-text/50'
        }`}
      >
        {selectedUsers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedUsers.map(u => (
              <span
                key={u.id}
                className="flex items-center gap-1 px-2 py-0.5 bg-card border border-border-main rounded-full text-[11px] font-semibold text-primary-text"
              >
                {u.name}
                <button
                  type="button"
                  onClick={e => remove(u.id, e)}
                  className="text-muted-text hover:text-primary-text"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-text font-medium text-[12px] truncate">{placeholder}</span>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-text transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border-main shadow-lg rounded-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border-main/50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-main rounded-lg text-[12px] text-primary-text outline-none focus:border-secondary-text transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {isLoading ? (
              <div className="px-3 py-6 text-center text-[12px] font-medium text-muted-text">
                Loading users...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] font-medium text-muted-text">
                No users found
              </div>
            ) : (
              filtered.map(user => {
                const isSelected = selectedUsers.some(s => s.id === user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggle(user)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-surface text-primary-text'
                        : 'text-secondary-text hover:bg-surface hover:text-primary-text'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-[11px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-primary-text truncate">
                        {user.displayName}
                      </p>
                      {user.mail && (
                        <p className="text-[10px] text-muted-text truncate">{user.mail}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
