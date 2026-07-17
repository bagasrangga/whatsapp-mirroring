import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchChatsByProject, deleteChat } from '@/lib/db'
import { formatChatTime, getStatusDotColor } from '@/lib/utils'
import { Search, ChevronLeft, Upload, X, Trash2, AlertTriangle } from 'lucide-react'
import ImportModal from '@/components/import/ImportModal'
import type { Chat } from '@/types'

export default function Sidebar() {
  const {
    activeProjectId,
    projects,
    chats,
    activeChatId,
    sidebarSearch,
    setChats,
    setActiveChat,
    setActiveProject,
    setSidebarSearch,
    removeChat,
  } = useAppStore()

  const [showImport, setShowImport] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  useEffect(() => {
    if (!activeProjectId) return
    fetchChatsByProject(activeProjectId)
      .then(setChats)
      .catch(console.error)
  }, [activeProjectId, setChats])

  const filtered = useMemo(() => {
    if (!sidebarSearch.trim()) return chats
    const q = sidebarSearch.toLowerCase()
    return chats.filter(
      (c) =>
        c.contact_name.toLowerCase().includes(q) ||
        c.last_message_snippet.toLowerCase().includes(q)
    )
  }, [chats, sidebarSearch])

  const confirmDelete = useCallback(async () => {
    if (!deletingChatId) return
    setDeleteLoading(true)
    try {
      await deleteChat(deletingChatId)
      removeChat(deletingChatId)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteLoading(false)
      setDeletingChatId(null)
    }
  }, [deletingChatId, removeChat])

  return (
    <>
      <aside className="w-[360px] flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-200 shadow-sidebar">
        {/* Header */}
        <div className="bg-wa-sidebar px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setActiveProject(null)}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Kembali ke dashboard"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground text-base truncate">
              {activeProject?.name ?? 'Project'}
            </h1>
            <p className="text-xs text-gray-500">{chats.length} vendor</p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-wa-green-dark border border-wa-green-dark/30 rounded-full px-3 py-1.5 hover:bg-wa-green-dark hover:text-white transition-colors cursor-pointer"
            aria-label="Import chat baru"
          >
            <Upload size={13} />
            Import
          </button>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 bg-wa-sidebar border-b border-gray-200">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Cari atau mulai obrolan baru"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-white text-sm pl-9 pr-9 py-2 rounded-lg border border-transparent focus:border-gray-300 outline-none transition-colors placeholder:text-gray-400"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
              {sidebarSearch ? (
                <>
                  <p className="text-sm font-medium text-gray-600">Tidak ada hasil</p>
                  <p className="text-xs text-gray-400">Coba kata kunci lain</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">Belum ada chat</p>
                  <p className="text-xs text-gray-400">Klik tombol Import untuk menambahkan</p>
                </>
              )}
            </div>
          ) : (
            <ul>
              {filtered.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => setActiveChat(chat.id)}
                  onDelete={() => setDeletingChatId(chat.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      {showImport && activeProjectId && (
        <ImportModal
          projectId={activeProjectId}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingChatId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingChatId(null) }}
        >
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm overflow-hidden slide-up">
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground">Hapus chat ini?</h3>
              <p className="text-sm text-gray-500">
                Seluruh pesan, lampiran, dan catatan chat{' '}
                <span className="font-medium text-foreground">
                  {chats.find((c) => c.id === deletingChatId)?.contact_name}
                </span>{' '}
                akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setDeletingChatId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Chat Item with hover delete ──────────────────────────────────────────────

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  const [hovered, setHovered] = useState(false)

  const colorMap: Record<string, string> = {
    'Opsi 1': 'bg-blue-50 text-blue-600 border-blue-100',
    'Opsi 2': 'bg-purple-50 text-purple-600 border-purple-100',
    'Ga Jadi': 'bg-red-50 text-red-600 border-red-100',
    'Mahal Brow': 'bg-amber-50 text-amber-600 border-amber-100',
  }

  return (
    <li
      className={`relative border-b border-gray-100 ${isActive ? 'bg-wa-sidebar' : 'hover:bg-wa-sidebar'} transition-colors`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSelect}
        className="w-full flex items-center gap-3 px-3 py-3 cursor-pointer text-left"
        aria-selected={isActive}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-wa-green-dark to-wa-green flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-base">
            {chat.contact_name[0]?.toUpperCase() ?? '?'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {chat.contact_name}
            </span>
            <span className="text-xs text-wa-timestamp flex-shrink-0">
              {formatChatTime(chat.last_message_at)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500 truncate flex-1">
              {chat.last_message_snippet || 'Belum ada pesan'}
            </p>
            {chat.status !== 'None' && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDotColor(chat.status)}`} />
            )}
          </div>
          {chat.status !== 'None' && (
            <div className="mt-1">
              <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border ${colorMap[chat.status] ?? ''}`}>
                {chat.status}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Delete button — appears on hover */}
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Hapus chat"
          title="Hapus chat ini"
        >
          <Trash2 size={13} className="text-red-500" />
        </button>
      )}
    </li>
  )
}
