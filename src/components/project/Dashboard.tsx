import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { createProject } from '@/lib/db'
import { FolderPlus, MessageSquare, ChevronRight, Plus } from 'lucide-react'

export default function Dashboard() {
  const { projects, addProject, setActiveProject } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const project = await createProject(newName.trim())
      addProject(project)
      setNewName('')
      setCreating(false)
      setActiveProject(project.id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wa-teal via-wa-green-dark to-wa-green flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <MessageSquare size={18} className="text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">WA Chat Comparer</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <div className="text-center mb-8 animate-in">
            <h1 className="text-3xl font-bold text-white mb-2">Bandingkan Vendor Anda</h1>
            <p className="text-white/70 text-sm">
              Import chat WhatsApp, bandingkan MUA, dekorasi, catering dalam satu tempat.
            </p>
          </div>

          {/* Projects Card */}
          <div className="bg-white rounded-2xl shadow-modal overflow-hidden animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-foreground">Project Saya</h2>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-wa-green-dark hover:text-wa-green transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Buat Baru
              </button>
            </div>

            {/* Create input */}
            {creating && (
              <div className="px-5 py-3 border-b border-gray-100 bg-green-50 slide-up">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nama project (misal: Persiapan Wedding)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-wa-green transition-colors"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || loading}
                    className="px-4 py-2 bg-wa-green text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-wa-green-dark transition-colors cursor-pointer"
                  >
                    {loading ? '...' : 'Buat'}
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName('') }}
                    className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Project list */}
            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <FolderPlus size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Belum ada project. Buat yang pertama!</p>
              </div>
            ) : (
              <ul>
                {projects.map((project, i) => (
                  <li key={project.id}>
                    <button
                      onClick={() => setActiveProject(project.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left group"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wa-green-dark to-wa-green flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-semibold text-base">
                          {project.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{project.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(project.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                    </button>
                    {i < projects.length - 1 && <div className="ml-[68px] border-b border-gray-100" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
