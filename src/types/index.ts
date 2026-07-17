// ─── Database Types ────────────────────────────────────────────────────────────

export type VendorStatus = 'None' | 'Opsi 1' | 'Opsi 2' | 'Ga Jadi' | 'Mahal Brow'

export interface Project {
  id: string
  name: string
  created_at: string
}

export interface Chat {
  id: string
  project_id: string
  contact_name: string
  vendor_phone_number: string
  status: VendorStatus
  internal_notes: string
  last_message_at: string
  last_message_snippet: string
  created_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_name: string
  timestamp: string // ISO string (UTC)
  text: string
  has_attachment: boolean
  attachment_url: string | null
  is_system_message: boolean
  is_dummy_reply: boolean
}

// ─── Parser Types ──────────────────────────────────────────────────────────────

export interface ParsedMessage {
  sender_name: string
  timestamp: Date
  text: string
  has_attachment: boolean
  attachment_file_name: string | null
  is_system_message: boolean
}

export interface ParsedChat {
  messages: ParsedMessage[]
}

// ─── Import Flow Types ─────────────────────────────────────────────────────────

export type ImportStage =
  | 'idle'
  | 'extracting'
  | 'uploading_media'
  | 'saving_messages'
  | 'done'
  | 'error'

export interface ImportProgress {
  stage: ImportStage
  mediaUploaded: number
  mediaTotal: number
  error?: string
}

// ─── UI Types ──────────────────────────────────────────────────────────────────

export interface ChatWithLastMessage extends Chat {
  // Derived for UI display
  unread?: number
}
