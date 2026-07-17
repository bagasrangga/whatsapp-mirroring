import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchProjects } from '@/lib/db'
import Sidebar from '@/components/layout/Sidebar'
import ChatView from '@/components/chat/ChatView'
import Dashboard from '@/components/project/Dashboard'

export default function App() {
  const { activeProjectId, activeChatId, setProjects } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [setProjects])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-wa-sidebar">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-wa-green border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  // No active project → show Dashboard
  if (!activeProjectId) {
    return <Dashboard />
  }

  // Active project → show full layout
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-wa-sidebar">
      {/* Sidebar - hidden on mobile if a chat is active */}
      <div className={`h-full ${activeChatId ? 'hidden md:block' : 'w-full md:w-auto'}`}>
        <Sidebar />
      </div>
      
      {/* Main chat area - hidden on mobile if no chat is active */}
      <main className={`flex-1 flex flex-col min-w-0 h-full ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <ChatView />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center chat-bg gap-4 select-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-10 py-8 flex flex-col items-center gap-3 shadow-panel max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-wa-green/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 3C8.82 3 3 8.82 3 16c0 2.35.61 4.56 1.69 6.48L3 29l6.7-1.66A13 13 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3z" fill="#25D366" fillOpacity="0.2" stroke="#25D366" strokeWidth="1.5"/>
          </svg>
        </div>
        <h2 className="text-base font-semibold text-foreground">Pilih chat untuk mulai</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pilih percakapan di sidebar atau import ZIP baru untuk membandingkan vendor Anda.
        </p>
      </div>
    </div>
  )
}
