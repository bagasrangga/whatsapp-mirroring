import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { extractVendorNameFromZip } from '@/lib/utils'
import { useImportPipeline } from '@/hooks/useImportPipeline'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  projectId: string
  onClose: () => void
}

export default function ImportModal({ projectId, onClose }: Props) {
  const { importProgress, resetImport } = useAppStore()
  const { runImport } = useImportPipeline()

  const [file, setFile] = useState<File | null>(null)
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProcessing = ['extracting', 'uploading_media', 'saving_messages'].includes(importProgress.stage)
  const isDone = importProgress.stage === 'done'
  const isError = importProgress.stage === 'error'

  useEffect(() => {
    return () => { resetImport() }
  }, [resetImport])

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.zip')) return
    setFile(f)
    setContactName(extractVendorNameFromZip(f.name))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const handleStart = useCallback(async () => {
    if (!file || !contactName.trim()) return
    await runImport({
      file,
      projectId,
      contactName: contactName.trim(),
      vendorPhoneNumber: phone.trim(),
    })
  }, [file, contactName, phone, projectId, runImport])

  const stageLabel: Record<string, string> = {
    extracting: 'Mengekstrak file ZIP...',
    uploading_media: `Mengunggah media (${importProgress.mediaUploaded}/${importProgress.mediaTotal})...`,
    saving_messages: 'Menyimpan pesan ke database...',
    done: 'Selesai! ✓',
    error: importProgress.error ?? 'Terjadi kesalahan.',
  }

  const mediaProgress = importProgress.mediaTotal > 0
    ? (importProgress.mediaUploaded / importProgress.mediaTotal) * 100
    : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isProcessing) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md overflow-hidden slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-foreground">Import Chat WhatsApp</h2>
          {!isProcessing && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer" aria-label="Tutup">
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Drop zone */}
          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center gap-3 py-10 cursor-pointer transition-all ${
                isDragging
                  ? 'border-wa-green bg-green-50'
                  : 'border-gray-300 hover:border-wa-green hover:bg-green-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload size={22} className={isDragging ? 'text-wa-green' : 'text-gray-400'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Seret file ZIP ke sini</p>
                <p className="text-xs text-gray-400 mt-0.5">atau klik untuk memilih file</p>
              </div>
              <p className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                Format: WhatsApp Chat - [Nama Vendor].zip
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {/* File selected — show form */}
          {file && !isProcessing && !isDone && !isError && (
            <div className="space-y-3 animate-in">
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <CheckCircle2 size={16} className="text-wa-green flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <button
                  onClick={() => { setFile(null); setContactName(''); setPhone('') }}
                  className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Vendor</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-wa-green transition-colors"
                  placeholder="Nama vendor"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nomor HP Vendor <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-wa-green transition-colors"
                  placeholder="0812-3456-7890"
                />
              </div>
            </div>
          )}

          {/* Progress UI */}
          {isProcessing && (
            <div className="space-y-3 animate-in">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-wa-green animate-spin flex-shrink-0" />
                <p className="text-sm text-gray-700">{stageLabel[importProgress.stage]}</p>
              </div>
              {importProgress.stage === 'uploading_media' && importProgress.mediaTotal > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Media</span>
                    <span>{importProgress.mediaUploaded}/{importProgress.mediaTotal}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wa-green rounded-full transition-all duration-300"
                      style={{ width: `${mediaProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-1.5">
                {['extracting', 'uploading_media', 'saving_messages'].map((stage, i) => (
                  <div
                    key={stage}
                    className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                      ['extracting', 'uploading_media', 'saving_messages'].indexOf(importProgress.stage) >= i
                        ? 'bg-wa-green'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {isDone && (
            <div className="flex flex-col items-center gap-2 py-4 animate-in">
              <CheckCircle2 size={36} className="text-wa-green" />
              <p className="font-semibold text-foreground">Import berhasil!</p>
              <p className="text-sm text-gray-500">Chat vendor telah tersimpan.</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3 py-3 animate-in">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{importProgress.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          {isDone ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-wa-green text-white text-sm font-medium rounded-xl hover:bg-wa-green-dark transition-colors cursor-pointer"
            >
              Selesai
            </button>
          ) : isError ? (
            <>
              <button
                onClick={resetImport}
                className="px-4 py-2 text-sm text-gray-600 hover:text-foreground transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </>
          ) : !isProcessing ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-foreground transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleStart}
                disabled={!file || !contactName.trim()}
                className="px-5 py-2.5 bg-wa-green text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-wa-green-dark transition-colors cursor-pointer"
              >
                Proses Import
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
