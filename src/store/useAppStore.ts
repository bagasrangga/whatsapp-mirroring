import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Chat, Message, VendorStatus, ImportProgress } from '@/types'
import { updateChatMeta } from '@/lib/db'
import { broadcastAction } from '@/lib/broadcast'

interface AppState {
  // ─── Project ──────────────────────────────────────────────────────────
  projects: Project[]
  activeProjectId: string | null
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  setActiveProject: (id: string | null) => void

  // ─── Chat ─────────────────────────────────────────────────────────────
  chats: Chat[]
  activeChatId: string | null
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  removeChat: (chatId: string) => void
  setActiveChat: (id: string | null) => void

  // ─── Messages ─────────────────────────────────────────────────────────
  messages: Message[]
  messagesLoading: boolean
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  removeMessage: (messageId: string) => void
  setMessagesLoading: (loading: boolean) => void

  // ─── Search ───────────────────────────────────────────────────────────
  sidebarSearch: string
  setSidebarSearch: (q: string) => void

  // ─── Import ───────────────────────────────────────────────────────────
  importProgress: ImportProgress
  setImportProgress: (progress: ImportProgress) => void
  resetImport: () => void

  // ─── Actions (with side effects) ──────────────────────────────────────
  updateChatStatus: (chatId: string, status: VendorStatus) => Promise<void>
  updateChatNotes: (chatId: string, notes: string) => Promise<void>
  updateChatLastMessage: (chatId: string, snippet: string, at: string) => void
}

const DEFAULT_IMPORT_PROGRESS: ImportProgress = {
  stage: 'idle',
  mediaUploaded: 0,
  mediaTotal: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // ─── Project ────────────────────────────────────────────────────────────
  projects: [],
  activeProjectId: null,
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  setActiveProject: (id) => set({ activeProjectId: id, activeChatId: null, chats: [], messages: [] }),

  // ─── Chat ───────────────────────────────────────────────────────────────
  chats: [],
  activeChatId: null,
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((s) => ({ chats: [chat, ...s.chats] })),
  updateChat: (chatId, updates) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
    })),
  removeChat: (chatId) =>
    set((s) => ({
      chats: s.chats.filter((c) => c.id !== chatId),
      activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
      messages: s.activeChatId === chatId ? [] : s.messages,
    })),
  // Fix Bug 1: Only reset messages if switching to a DIFFERENT chat
  setActiveChat: (id) =>
    set((s) => ({
      activeChatId: id,
      messages: id === s.activeChatId ? s.messages : [],
    })),

  // ─── Messages ──────────────────────────────────────────────────────────
  messages: [],
  messagesLoading: false,
  setMessages: (messages) => set({ messages }),
  // Optimistic: insert by timestamp order (rerender-derived-state pattern)
  addMessage: (message) =>
    set((s) => ({
      messages: [...s.messages, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    })),
  removeMessage: (messageId) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) })),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

  // ─── Search ─────────────────────────────────────────────────────────────
  sidebarSearch: '',
  setSidebarSearch: (q) => set({ sidebarSearch: q }),

  // ─── Import ─────────────────────────────────────────────────────────────
  importProgress: DEFAULT_IMPORT_PROGRESS,
  setImportProgress: (progress) => set({ importProgress: progress }),
  resetImport: () => set({ importProgress: DEFAULT_IMPORT_PROGRESS }),

  // ─── Actions ─────────────────────────────────────────────────────────────
  updateChatStatus: async (chatId, status) => {
    get().updateChat(chatId, { status })
    await updateChatMeta(chatId, { status })
    broadcastAction(get().activeProjectId, { type: 'CHAT_UPDATED', chatId, updates: { status } })
  },

  updateChatNotes: async (chatId, notes) => {
    get().updateChat(chatId, { internal_notes: notes })
    await updateChatMeta(chatId, { internalNotes: notes })
    broadcastAction(get().activeProjectId, { type: 'CHAT_UPDATED', chatId, updates: { internal_notes: notes } })
  },

  updateChatLastMessage: (chatId, snippet, at) => {
    // Sort chats so the updated one floats to top
    set((s) => {
      const updated = s.chats.map((c) =>
        c.id === chatId
          ? { ...c, last_message_snippet: snippet, last_message_at: at }
          : c
      )
      updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      return { chats: updated }
    })
  },
    }),
    {
      name: 'whatsapp-mirror-store',
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeChatId: state.activeChatId,
      }),
    }
  )
)
