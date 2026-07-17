import { memo, useState, useCallback } from 'react'
import { formatBubbleTime } from '@/lib/utils'
import { FileText, File, ImageOff, Music, Trash2 } from 'lucide-react'
import type { Message } from '@/types'

interface Props {
  message: Message
  isOwner: boolean
  onDelete?: (messageId: string) => void
  onImageClick?: (url: string) => void
}

const MessageBubble = memo(function MessageBubble({ message, isOwner, onDelete, onImageClick }: Props) {
  const [showDelete, setShowDelete] = useState(false)

  const handleDelete = useCallback(() => {
    onDelete?.(message.id)
  }, [message.id, onDelete])

  if (message.is_system_message) {
    return (
      <div className="flex justify-center my-2">
        <span className="system-pill max-w-xs text-center">{message.text}</span>
      </div>
    )
  }

  return (
    <div
      className={`flex mb-1 ${isOwner ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Delete button for dummy replies — left side of bubble */}
      {message.is_dummy_reply && showDelete && onDelete && (
        <div className="flex items-center mr-1.5">
          <button
            onClick={handleDelete}
            className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Hapus pesan"
            title="Hapus pesan ini"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        </div>
      )}

      <div
        className={`relative max-w-[68%] min-w-[60px] px-3 py-2 ${
          message.is_dummy_reply
            ? 'bubble-dummy'
            : isOwner
            ? 'bubble-out'
            : 'bubble-in'
        }`}
      >
        {/* Sender name for incoming */}
        {!isOwner && (
          <p className="text-xs font-semibold text-wa-green-dark mb-0.5 leading-tight">
            {message.sender_name}
          </p>
        )}

        {/* Dummy reply label */}
        {message.is_dummy_reply && (
          <p className="text-[10px] font-semibold text-blue-500 mb-0.5">💬 Catatan / Simulasi</p>
        )}

        {/* Attachment */}
        {message.has_attachment && (
          <AttachmentContent
            url={message.attachment_url}
            fileName={message.attachment_url?.split('/').pop() ?? ''}
            onImageClick={onImageClick}
          />
        )}

        {/* Text content */}
        {message.text && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="text-[10px] text-wa-timestamp">
            {formatBubbleTime(message.timestamp)}
          </span>
          {/* Read ticks for outgoing (non-dummy) */}
          {isOwner && !message.is_dummy_reply && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-wa-read">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5L8.5 8.5L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  )
})

export default MessageBubble

// ─── Grouped Messages ─────────────────────────────────────────────────────────

interface GroupProps {
  messages: Message[]
  isOwner: boolean
  onImageClick?: (url: string) => void
}

export const MessageGroupBubble = memo(function MessageGroupBubble({ messages, isOwner, onImageClick }: GroupProps) {
  if (messages.length === 0) return null
  const firstMsg = messages[0]

  return (
    <div className={`flex mb-1 ${isOwner ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[68%] min-w-[60px] p-1.5 ${isOwner ? 'bubble-out' : 'bubble-in'}`}>
        {!isOwner && (
          <p className="text-xs font-semibold text-wa-green-dark mb-1 px-1.5 pt-0.5 leading-tight">
            {firstMsg.sender_name}
          </p>
        )}
        
        <div className={`grid gap-1 ${messages.length === 2 ? 'grid-cols-2' : messages.length >= 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="relative aspect-square overflow-hidden rounded-md cursor-pointer group"
              onClick={() => msg.attachment_url && onImageClick?.(msg.attachment_url)}
            >
              {msg.attachment_url ? (
                <img
                  src={msg.attachment_url}
                  alt="Attachment"
                  loading="lazy"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                <ImageOff size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp of the last message */}
        <div className="flex items-center gap-1 mt-1 justify-end px-1">
          <span className="text-[10px] text-wa-timestamp">
            {formatBubbleTime(messages[messages.length - 1].timestamp)}
          </span>
          {isOwner && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-wa-read">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5L8.5 8.5L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  )
})

// ─── Attachment Content ────────────────────────────────────────────────────────

function AttachmentContent({ url, fileName, onImageClick }: { url: string | null; fileName: string; onImageClick?: (url: string) => void }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2.5 mb-1.5 border border-gray-200">
        <ImageOff size={16} className="text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 italic">Media tidak tersedia</span>
      </div>
    )
  }

  const lower = (fileName || url.split('/').pop() || '').toLowerCase()
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/.test(lower)
  const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?.*)?$/.test(lower)
  const isAudio = /\.(ogg|mp3|m4a|opus|aac|amr)(\?.*)?$/.test(lower)
  const isPdf = /\.pdf(\?.*)?$/.test(lower)

  if (isImage) {
    return (
      <div className="mb-1.5 rounded-lg overflow-hidden">
        <img
          src={url}
          alt={fileName}
          loading="lazy"
          crossOrigin="anonymous"
          className="max-w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onImageClick ? onImageClick(url) : window.open(url, '_blank')}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.currentTarget
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className="hidden flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2.5 border border-gray-200">
          <ImageOff size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 italic">Gagal memuat gambar</span>
        </div>
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="mb-1.5 rounded-lg overflow-hidden bg-black">
        <video
          src={url}
          controls
          className="max-w-full max-h-48 rounded-lg"
        />
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 mb-1.5 border border-gray-200">
        <Music size={16} className="text-wa-green flex-shrink-0" />
        <audio controls src={url} className="flex-1 h-8 min-w-0" />
      </div>
    )
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2.5 mb-1.5 border border-red-100 hover:bg-red-100 transition-colors"
      >
        <FileText size={16} className="text-red-500 flex-shrink-0" />
        <span className="text-xs font-medium text-red-700 truncate">{fileName || 'Dokumen PDF'}</span>
      </a>
    )
  }

  // Generic file
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 mb-1.5 border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <File size={16} className="text-gray-500 flex-shrink-0" />
      <span className="text-xs font-medium text-gray-700 truncate">{fileName || 'File'}</span>
    </a>
  )
}
