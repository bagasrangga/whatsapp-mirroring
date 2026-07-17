import type { ParsedMessage } from '@/types'

/**
 * WhatsApp Desktop Mac chat parser
 *
 * Strict format: [DD/MM/YYYY, H.MM.SS AM/PM] SenderName: MessageText
 *
 * Examples:
 *   [16/07/2026, 8.55.56 PM] Bagas R: Halo, berapa harga paket A?
 *   [16/07/2026, 9.01.12 AM] MUA Riadini: Paket A mulai dari 2,5jt kak
 *   [16/07/2026, 9.02.00 AM] MUA Riadini: ‎<attached: IMG-20260716-WA0001.jpg>
 *
 * System messages (no sender): e.g. "Messages and calls are end-to-end encrypted..."
 */

// Strict regex for Mac Desktop WhatsApp timestamp
// [16/07/2026, 8.55.56 PM]
// Space before AM/PM is optional (Mac Desktop may omit it: "1.33.29PM" or "1.33.29 PM")
// Add optional unicode direction marks at the start of the line
const LINE_REGEX =
  /^[\u200e\u200f\u202a\u202c\u200b]*\[(\d{1,2})\/(\d{1,2})\/(\d{4}),\s(\d{1,2})\.(\d{2})\.(\d{2})\s?(AM|PM)\]\s(.+)$/

// Attachment indicator patterns in WhatsApp Mac Desktop export
// Handles various formats and optional left-to-right mark (U+200E)
const ATTACHMENT_REGEX = /<attached:\s*(.+?)>/i
const ATTACHMENT_OMITTED_REGEX = /^[\u200e\u202a\u202c]*(.+?)\s+\(file attached\)\s*$/i
const MEDIA_OMITTED_REGEX = /^[\u200e\u202a\u202c]*<Media omitted>\s*$/i
// WhatsApp sometimes uses: "filename.jpg (file attached)" without angle brackets
const BARE_ATTACHMENT_REGEX = /^[\u200e\u202a\u202c]*(\S+\.(?:jpg|jpeg|png|gif|webp|mp4|mov|pdf|doc|docx|ogg|mp3|opus|m4a|aac|amr|3gp|webm))\s*$/i

// Known system message patterns
const SYSTEM_MESSAGE_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /changed the subject/i,
  /changed this group/i,
  /added you/i,
  /removed you/i,
  /left$/i,
  /was added$/i,
  /Messages to this chat and calls are now secured/i,
  /This message was deleted/i,
  /You deleted this message/i,
]

function isSystemMessage(text: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some((re) => re.test(text))
}

function parseTimestamp(
  day: string,
  month: string,
  year: string,
  hour: string,
  minute: string,
  second: string,
  ampm: string
): Date {
  let h = parseInt(hour, 10)
  const m = parseInt(minute, 10)
  const s = parseInt(second, 10)

  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0

  // Construct as local time → convert to UTC via Date
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    h,
    m,
    s
  )
}

function parseMessageContent(content: string): {
  senderName: string
  text: string
  hasAttachment: boolean
  attachmentFileName: string | null
} {
  // Split sender from message: "SenderName: rest"
  const colonIdx = content.indexOf(': ')
  if (colonIdx === -1) {
    // System message without sender
    return {
      senderName: 'system',
      text: content.trim(),
      hasAttachment: false,
      attachmentFileName: null,
    }
  }

  const senderName = content.substring(0, colonIdx).trim()
  const rawText = content.substring(colonIdx + 2).trim()

  // Check for attachment patterns
  const attachedMatch = rawText.match(ATTACHMENT_REGEX)
  if (attachedMatch) {
    let remainingText = rawText.replace(attachedMatch[0], '').trim()
    
    // Optionally clean up WhatsApp's auto-generated file info like "filename.pdf • 4 pages"
    // by checking if remainingText looks like file metadata. But keeping it is also fine.
    // For now we keep it so any captions are preserved.

    return {
      senderName,
      text: remainingText,
      hasAttachment: true,
      attachmentFileName: attachedMatch[1].trim(),
    }
  }

  const omittedMatch = rawText.match(ATTACHMENT_OMITTED_REGEX)
  if (omittedMatch) {
    return {
      senderName,
      text: '',
      hasAttachment: true,
      attachmentFileName: omittedMatch[1].trim(),
    }
  }

  if (MEDIA_OMITTED_REGEX.test(rawText)) {
    return {
      senderName,
      text: '',
      hasAttachment: true,
      attachmentFileName: null,
    }
  }

  const bareMatch = rawText.match(BARE_ATTACHMENT_REGEX)
  if (bareMatch) {
    return {
      senderName,
      text: '',
      hasAttachment: true,
      attachmentFileName: bareMatch[1].trim(),
    }
  }

  return {
    senderName,
    text: rawText,
    hasAttachment: false,
    attachmentFileName: null,
  }
}

/**
 * Parse the full text content of a WhatsApp _chat.txt file
 * Returns an array of ParsedMessage objects
 */
export function parseChatText(rawText: string): ParsedMessage[] {
  const lines = rawText.split('\n')
  const messages: ParsedMessage[] = []
  let currentMessage: ParsedMessage | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(LINE_REGEX)

    if (match) {
      // Save previous accumulated message
      if (currentMessage) {
        messages.push(currentMessage)
      }

      const [, day, month, year, hour, minute, second, ampm, content] = match
      const timestamp = parseTimestamp(day, month, year, hour, minute, second, ampm)

      // Check if it's a system message (no sender colon pattern in content)
      const colonIdx = content.indexOf(': ')
      if (colonIdx === -1 || isSystemMessage(content)) {
        currentMessage = {
          sender_name: 'system',
          timestamp,
          text: content.trim(),
          has_attachment: false,
          attachment_file_name: null,
          is_system_message: true,
        }
      } else {
        const { senderName, text, hasAttachment, attachmentFileName } = parseMessageContent(content)
        currentMessage = {
          sender_name: senderName,
          timestamp,
          text,
          has_attachment: hasAttachment,
          attachment_file_name: attachmentFileName,
          is_system_message: false,
        }
      }
    } else if (currentMessage) {
      // Continuation line (multi-line message) — append to previous text
      currentMessage.text += '\n' + trimmed
    }
  }

  // Push the last message
  if (currentMessage) {
    messages.push(currentMessage)
  }

  return messages
}
