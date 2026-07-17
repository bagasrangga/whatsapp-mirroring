import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Utility for combining Tailwind class names */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a Date or ISO string for sidebar display (Today: HH:MM, else DD/MM/YY) */
export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Kemarin'

  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/** Format a Date or ISO string for bubble timestamp display (HH:MM) */
export function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Format a Date for section header (e.g. "16 Juli 2026") */
export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (isToday) return 'Hari ini'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  if (isYesterday) return 'Kemarin'

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Generate a random UUID (crypto.randomUUID fallback) */
export function generateId(): string {
  return crypto.randomUUID()
}

/** Detect MIME type from filename extension */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ogg: 'audio/ogg',
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
  }
  return map[ext] ?? 'application/octet-stream'
}

/** Check if a MIME type is an image */
export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/')
}

/** Check if a MIME type is a video */
export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/')
}

/** Check if a MIME type is audio */
export function isAudioMime(mime: string): boolean {
  return mime.startsWith('audio/')
}

/** Extract vendor name from WhatsApp ZIP filename
 * Supports: "WhatsApp Chat - MUA Riadini.zip" → "MUA Riadini"
 */
export function extractVendorNameFromZip(filename: string): string {
  const withoutExt = filename.replace(/\.zip$/i, '')
  // Pattern: "WhatsApp Chat - <name>" or "WhatsApp Chat with <name>" or "WhatsApp Chat dengan <name>"
  const match = withoutExt.match(/WhatsApp Chat[\s-]+(with|dengan|-)?\s*(.+)/i)
  if (match) {
    return match[2].trim()
  }
  return withoutExt.trim()
}

/** Get status color class */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Opsi 1': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Opsi 2': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Ga Jadi': return 'bg-red-100 text-red-700 border-red-200'
    case 'Mahal Brow': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Full Booked': return 'bg-gray-100 text-gray-700 border-gray-300'
    default: return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

/** Get status dot color class */
export function getStatusDotColor(status: string): string {
  switch (status) {
    case 'Opsi 1': return 'bg-blue-500'
    case 'Opsi 2': return 'bg-purple-500'
    case 'Ga Jadi': return 'bg-red-500'
    case 'Mahal Brow': return 'bg-amber-500'
    case 'Full Booked': return 'bg-gray-500'
    default: return 'bg-slate-400'
  }
}
