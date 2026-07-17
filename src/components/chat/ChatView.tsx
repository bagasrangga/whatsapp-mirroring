import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchMessages, insertDummyReply, updateChatMeta, deleteMessage } from '@/lib/db'
import { formatDateHeader } from '@/lib/utils'
import MessageBubble, { MessageGroupBubble } from './MessageBubble'
import VendorPanel from './VendorPanel'
import { Search, Send, Smile, Info, X, ChevronLeft } from 'lucide-react'
import type { Message } from '@/types'

// The owner's name as fixed in blueprint
const OWNER_NAME = 'Bagas R'

export default function ChatView() {
  const { activeChatId, chats, messages, messagesLoading, setMessages, setMessagesLoading, addMessage, updateChatLastMessage, setActiveChat } = useAppStore()
  const [draftText, setDraftText] = useState('')
  const [sending, setSending] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Lightbox state
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const activeChat = chats.find((c) => c.id === activeChatId)

  useEffect(() => {
    if (isSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
    }
  }, [isSearching])

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
    if (!isSearching) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSearching])

  // Group messages by date for section headers
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''

    const filteredMessages = searchQuery.trim() 
      ? messages.filter(msg => msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) || msg.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      : messages;

    for (const msg of filteredMessages) {
      const dateKey = new Date(msg.timestamp).toDateString()
      if (dateKey !== currentDate) {
        currentDate = dateKey
        groups.push({ date: msg.timestamp, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }
    return groups
  }, [messages, searchQuery])

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
    <div className="flex h-full relative overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="bg-wa-sidebar px-3 md:px-4 py-3 flex items-center gap-2 md:gap-3 border-b border-gray-200 flex-shrink-0 min-h-[64px]">
          {isSearching ? (
             <div className="flex w-full items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
                <button onClick={() => setIsSearching(false)} className="p-2 -ml-1 mr-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Tutup pencarian">
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1 relative">
                   <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   <input
                     ref={searchInputRef}
                     type="search"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Cari pesan di chat ini..."
                     className="w-full bg-white text-sm pl-9 pr-9 py-2 rounded-lg border border-transparent focus:border-gray-300 outline-none transition-colors placeholder:text-gray-400"
                   />
                   {searchQuery && (
                     <button
                       onClick={() => setSearchQuery('')}
                       className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                     >
                       <X size={14} />
                     </button>
                   )}
                </div>
             </div>
          ) : (
             <>
                <div className="md:hidden">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="p-1 -ml-1 mr-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    aria-label="Kembali"
                  >
                    <ChevronLeft size={24} className="text-gray-600" />
                  </button>
                </div>
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
                  <button onClick={() => setIsSearching(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Cari pesan">
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
             </>
          )}
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
            groupedMessages.map((group) => {
              // Create sub-groups for consecutive image messages
              const blocks: (Message | Message[])[] = []
              for (const msg of group.messages) {
                const isImage = msg.has_attachment && !msg.text && msg.attachment_url && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(msg.attachment_url || '')
                if (isImage) {
                  const lastBlock = blocks[blocks.length - 1]
                  if (Array.isArray(lastBlock) && lastBlock[0].sender_name === msg.sender_name && lastBlock[0].is_dummy_reply === msg.is_dummy_reply) {
                    lastBlock.push(msg)
                    continue
                  }
                  if (!Array.isArray(lastBlock) && lastBlock && lastBlock.sender_name === msg.sender_name && lastBlock.is_dummy_reply === msg.is_dummy_reply && lastBlock.has_attachment && !lastBlock.text && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(lastBlock.attachment_url || '')) {
                    blocks[blocks.length - 1] = [lastBlock, msg]
                    continue
                  }
                  blocks.push([msg]) // start new group
                  continue
                }
                blocks.push(msg)
              }

              return (
                <div key={group.date}>
                  {/* Date divider */}
                  <div className="flex items-center justify-center my-3">
                    <span className="system-pill">{formatDateHeader(group.date)}</span>
                  </div>
                  {blocks.map((block) => {
                    if (Array.isArray(block)) {
                      return (
                        <MessageGroupBubble
                          key={`group-${block[0].id}`}
                          messages={block}
                          isOwner={block[0].sender_name === OWNER_NAME || block[0].is_dummy_reply}
                          onImageClick={setSelectedImage}
                        />
                      )
                    }
                    return (
                      <MessageBubble
                        key={block.id}
                        message={block}
                        isOwner={block.sender_name === OWNER_NAME || block.is_dummy_reply}
                        onDelete={block.is_dummy_reply ? handleDeleteMessage : undefined}
                        onImageClick={setSelectedImage}
                      />
                    )
                  })}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-wa-sidebar px-2 md:px-4 py-3 flex items-end gap-2 md:gap-3 border-t border-gray-200 flex-shrink-0">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex-shrink-0" aria-label="Emoji">
            <Smile size={22} />
          </button>
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex items-end px-3 md:px-4 py-2 min-h-[44px]">
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

      {/* Lightbox / Modal for Images */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            aria-label="Tutup"
          >
            <X size={24} />
          </button>
          
          {selectedImage.toLowerCase().match(/\.pdf(\?.*)?$/) ? (
            <div
              className="w-[90vw] h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={selectedImage}
                title="PDF Viewer"
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <img
              src={selectedImage}
              alt="Expanded view"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
              crossOrigin="anonymous"
            />
          )}
        </div>
      )}
    </div>
  )
}
