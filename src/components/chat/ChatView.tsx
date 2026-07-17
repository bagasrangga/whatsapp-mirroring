import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchMessages, insertDummyReply, updateChatMeta, deleteMessage } from '@/lib/db'
import { formatDateHeader } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import VendorPanel from './VendorPanel'
import { Search, Send, Smile, Info } from 'lucide-react'
import type { Message } from '@/types'

// The owner's name as fixed in blueprint
const OWNER_NAME = 'Bagas R'

export default function ChatView() {
  const { activeChatId, chats, messages, messagesLoading, setMessages, setMessagesLoading, addMessage, updateChatLastMessage } = useAppStore()
  const [draftText, setDraftText] = useState('')
  const [sending, setSending] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeChat = chats.find((c) => c.id === activeChatId)

  useEffect(() => {
    if (!activeChatId) return
    setMessagesLoading(true)
    fetchMessages(activeChatId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setMessagesLoading(false))
  }, [activeChatId, setMessages, setMessagesLoading])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Group messages by date for section headers
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''

    for (const msg of messages) {
      const dateKey = new Date(msg.timestamp).toDateString()
      if (dateKey !== currentDate) {
        currentDate = dateKey
        groups.push({ date: msg.timestamp, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }
    return groups
  }, [messages])

  const handleSendDummy = useCallback(async () => {
    if (!draftText.trim() || !activeChatId || sending) return
    const text = draftText.trim()
    setDraftText('')
    setSending(true)

    try {
      const msg = await insertDummyReply({ chatId: activeChatId, text })
      addMessage(msg)
      // Update sidebar
      await updateChatMeta(activeChatId, {
        lastMessageAt: msg.timestamp,
        lastMessageSnippet: text.slice(0, 80),
      })
      updateChatLastMessage(activeChatId, text.slice(0, 80), msg.timestamp)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }, [draftText, activeChatId, sending, addMessage, updateChatLastMessage])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      useAppStore.getState().removeMessage(messageId)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendDummy()
      }
    },
    [handleSendDummy]
  )

  if (!activeChat) return null

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="bg-wa-sidebar px-4 py-3 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wa-green-dark to-wa-green flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">
              {activeChat.contact_name[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowPanel(!showPanel)}>
            <p className="font-semibold text-sm text-foreground truncate">{activeChat.contact_name}</p>
            <p className="text-xs text-gray-500 truncate">
              {activeChat.vendor_phone_number || 'Ketuk untuk info vendor'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Cari pesan">
              <Search size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Info vendor"
            >
              <Info size={18} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto chat-bg px-4 py-4 space-y-1">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-wa-green border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="system-pill">Belum ada pesan</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-3">
                  <span className="system-pill">{formatDateHeader(group.date)}</span>
                </div>
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwner={msg.sender_name === OWNER_NAME || msg.is_dummy_reply}
                    onDelete={msg.is_dummy_reply ? handleDeleteMessage : undefined}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-wa-sidebar px-4 py-3 flex items-end gap-3 border-t border-gray-200 flex-shrink-0">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex-shrink-0" aria-label="Emoji">
            <Smile size={22} />
          </button>
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex items-end px-4 py-2 min-h-[44px]">
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik catatan atau balasan simulasi..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-foreground placeholder:text-gray-400 max-h-32 overflow-y-auto leading-relaxed bg-transparent"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`
              }}
            />
          </div>
          <button
            onClick={handleSendDummy}
            disabled={!draftText.trim() || sending}
            className="w-10 h-10 rounded-full bg-wa-green flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-wa-green-dark transition-colors cursor-pointer shadow-sm"
            aria-label="Kirim"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Vendor panel (slide in from right) */}
      {showPanel && (
        <VendorPanel chat={activeChat} onClose={() => setShowPanel(false)} />
      )}
    </div>
  )
}
