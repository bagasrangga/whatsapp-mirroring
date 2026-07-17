import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { X, Phone, StickyNote, Tag } from 'lucide-react'
import type { Chat, VendorStatus } from '@/types'
import { getStatusColor } from '@/lib/utils'

const STATUSES: VendorStatus[] = ['None', 'Opsi 1', 'Opsi 2', 'Ga Jadi', 'Mahal Brow', 'Full Booked']

interface Props {
  chat: Chat
  onClose: () => void
}

export default function VendorPanel({ chat, onClose }: Props) {
  const { updateChatStatus, updateChatNotes } = useAppStore()
  const [notes, setNotes] = useState(chat.internal_notes)
  const [savingNotes, setSavingNotes] = useState(false)

  const handleStatusChange = useCallback(
    async (status: VendorStatus) => {
      await updateChatStatus(chat.id, status)
    },
    [chat.id, updateChatStatus]
  )

  const handleSaveNotes = useCallback(async () => {
    setSavingNotes(true)
    try {
      await updateChatNotes(chat.id, notes)
    } finally {
      setSavingNotes(false)
    }
  }, [chat.id, notes, updateChatNotes])

  return (
    <aside className="absolute md:relative inset-y-0 right-0 z-40 w-full md:w-[320px] flex-shrink-0 h-full bg-wa-sidebar border-l border-gray-200 flex flex-col overflow-y-auto slide-in-left shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="bg-wa-teal px-4 py-3 flex items-center gap-3">
        <h2 className="flex-1 text-white font-semibold text-base">Info Vendor</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Tutup panel"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Avatar & name */}
      <div className="flex flex-col items-center gap-2 py-6 bg-white border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wa-green-dark to-wa-green flex items-center justify-center shadow-md">
          <span className="text-white text-3xl font-bold">
            {chat.contact_name[0]?.toUpperCase()}
          </span>
        </div>
        <p className="font-semibold text-foreground text-lg">{chat.contact_name}</p>
        {chat.vendor_phone_number && (
          <a
            href={`tel:${chat.vendor_phone_number}`}
            className="flex items-center gap-1.5 text-sm text-wa-green-dark hover:text-wa-green transition-colors"
          >
            <Phone size={14} />
            {chat.vendor_phone_number}
          </a>
        )}
      </div>

      {/* Status section */}
      <div className="px-4 py-4 bg-white mt-2 border-y border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Status Vendor</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                chat.status === s
                  ? getStatusColor(s) + ' shadow-sm scale-105'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes section */}
      <div className="px-4 py-4 bg-white mt-2 border-y border-gray-100 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StickyNote size={14} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Catatan Internal</h3>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan tentang vendor ini... (hanya terlihat di aplikasi ini)"
          rows={5}
          className="w-full text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 outline-none focus:border-amber-300 transition-colors resize-none placeholder:text-gray-400 leading-relaxed"
        />
        <button
          onClick={handleSaveNotes}
          disabled={savingNotes || notes === chat.internal_notes}
          className="self-end px-4 py-2 bg-wa-green text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-wa-green-dark transition-colors cursor-pointer"
        >
          {savingNotes ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </div>
    </aside>
  )
}
