import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getBroadcastChannel, BroadcastEvent } from '@/lib/broadcast'
import { fetchChatsByProject, fetchMessages } from '@/lib/db'

export function useRealtime() {
  const { activeProjectId, activeChatId, updateChat } = useAppStore()

  useEffect(() => {
    if (!activeProjectId) return

    const channel = getBroadcastChannel(activeProjectId)
    
    // Listen to broadcast events
    channel.on(
      'broadcast',
      { event: 'sync' },
      async ({ payload }: { payload: BroadcastEvent }) => {
        if (!payload) return

        if (payload.type === 'CHAT_UPDATED') {
          // Update the chat in the sidebar
          updateChat(payload.chatId, payload.updates)
        } 
        
        else if (payload.type === 'MESSAGES_CHANGED') {
          // If the changed messages belong to the currently open chat, refetch them
          if (activeChatId === payload.chatId) {
            const newMessages = await fetchMessages(payload.chatId)
            useAppStore.getState().setMessages(newMessages)
          }
        } 
        
        else if (payload.type === 'CHAT_IMPORTED') {
          // A full chat was imported, refetch all chats for this project
          const allChats = await fetchChatsByProject(activeProjectId)
          useAppStore.getState().setChats(allChats)
          
          // If the imported chat is currently open, refetch its messages
          if (activeChatId === payload.chatId) {
            const newMessages = await fetchMessages(payload.chatId)
            useAppStore.getState().setMessages(newMessages)
          }
        }
      }
    )

    return () => {
      // Don't unsubscribe here because we want the channel to persist across renders 
      // as long as the project is active. It will be managed by getBroadcastChannel.
    }
  }, [activeProjectId, activeChatId, updateChat])
}
