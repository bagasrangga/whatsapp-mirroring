import { useCallback } from 'react'
import { parseZipFile } from '@/lib/parser/zip-parser'
import { getMimeType, generateId } from '@/lib/utils'
import {
  createChat,
  findChatByName,
  findChatBySenderName,
  getLastRealMessageTimestamp,
  bulkInsertMessages,
  uploadMedia,
  updateChatMeta,
} from '@/lib/db'
import { broadcastAction } from '@/lib/broadcast'
import { useAppStore } from '@/store/useAppStore'
import type { ImportProgress } from '@/types'

interface ImportParams {
  file: File
  projectId: string
  contactName: string
  vendorPhoneNumber: string
  onConfirmSync?: (chatName: string) => Promise<boolean>
}

/**
 * Import pipeline hook:
 * 1. Extract ZIP in browser (JSZip)
 * 2. Upload media to Supabase Storage
 * 3. Bulk insert messages to Supabase DB
 * 4. Handles Smart Sync (delta sync for existing vendors)
 */
export function useImportPipeline() {
  const { addChat, updateChat, setImportProgress } = useAppStore()

  const runImport = useCallback(
    async ({ file, projectId, contactName, vendorPhoneNumber, onConfirmSync }: ImportParams) => {
      const progress = (p: Partial<ImportProgress>) =>
        setImportProgress({ ...useAppStore.getState().importProgress, ...p })

      try {
        // Stage 1: Extract ZIP
        progress({ stage: 'extracting', mediaUploaded: 0, mediaTotal: 0 })
        const { parsed, mediaFiles, hasChat } = await parseZipFile(file)

        if (!hasChat || parsed.messages.length === 0) {
          progress({ stage: 'error', error: 'File _chat.txt tidak ditemukan di dalam ZIP.' })
          return
        }

        // Check for existing vendor (Smart Sync)
        let existingChat = await findChatByName(projectId, contactName)

        if (!existingChat) {
          // Fallback: Try to match by sender names inside the chat
          const OWNER_NAME = 'Bagas R'
          const counterparties = Array.from(new Set(parsed.messages
            .filter(m => !m.is_system_message && m.sender_name !== OWNER_NAME && m.sender_name !== 'system')
            .map(m => m.sender_name)
          ))
          
          for (const cp of counterparties) {
            const matched = await findChatBySenderName(projectId, cp)
            if (matched) {
              existingChat = matched
              break
            }
          }
        }

        if (existingChat && onConfirmSync) {
          const confirmed = await onConfirmSync(existingChat.contact_name)
          if (!confirmed) {
            progress({ stage: 'idle', mediaUploaded: 0, mediaTotal: 0 })
            return
          }
        }

        let chatId: string
        let lastRealTimestamp: Date | null = null

        if (existingChat) {
          chatId = existingChat.id
          const lastTs = await getLastRealMessageTimestamp(chatId)
          if (lastTs) lastRealTimestamp = new Date(lastTs)
        } else {
          // Create new chat entry
          const lastMsg = [...parsed.messages]
            .filter((m) => !m.is_system_message)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

          const newChat = await createChat({
            projectId,
            contactName,
            vendorPhoneNumber,
            lastMessageAt: lastMsg?.timestamp.toISOString() ?? new Date().toISOString(),
            lastMessageSnippet: lastMsg?.text.slice(0, 80) ?? '',
          })

          chatId = newChat.id
          addChat(newChat)
        }

        // Filter to only new messages if syncing
        const messagesToProcess = lastRealTimestamp
          ? parsed.messages.filter((m) => m.timestamp > lastRealTimestamp!)
          : parsed.messages

        if (messagesToProcess.length === 0 && existingChat) {
          progress({ stage: 'done' })
          return
        }

        // Stage 2: Upload media
        progress({
          stage: 'uploading_media',
          mediaTotal: mediaFiles.size,
          mediaUploaded: 0,
        })

        const mediaUrlMap = new Map<string, string | null>()
        let uploaded = 0

        for (const [fileName, data] of mediaFiles.entries()) {
          const mimeType = getMimeType(fileName)
          const url = await uploadMedia(chatId, fileName, data, mimeType)
          mediaUrlMap.set(fileName, url)
          uploaded++
          progress({ mediaUploaded: uploaded })
        }

        // Stage 3: Save messages
        progress({ stage: 'saving_messages' })

        const messageDocs = messagesToProcess.map((m) => ({
          id: generateId(),
          chat_id: chatId,
          sender_name: m.sender_name,
          timestamp: m.timestamp.toISOString(),
          text: m.text,
          has_attachment: m.has_attachment,
          attachment_url: m.attachment_file_name
            ? (mediaUrlMap.get(m.attachment_file_name) ?? null)
            : null,
          is_system_message: m.is_system_message,
          is_dummy_reply: false,
        }))

        await bulkInsertMessages(messageDocs)

        // Update last message meta
        const lastReal = messageDocs
          .filter((m) => !m.is_system_message)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

        if (lastReal) {
          await updateChatMeta(chatId, {
            lastMessageAt: lastReal.timestamp,
            lastMessageSnippet: lastReal.text.slice(0, 80),
          })

          const store = useAppStore.getState()
          
          if (existingChat) {
            store.updateChat(chatId, {
              last_message_at: lastReal.timestamp,
              last_message_snippet: lastReal.text.slice(0, 80),
            })
          }
          
          // Set unread for newly synced messages
          store.incrementUnread(chatId, messagesToProcess.length)
        }

        progress({ stage: 'done' })
        broadcastAction(projectId, { type: 'CHAT_IMPORTED', chatId })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengimpor.'
        progress({ stage: 'error', error: msg })
        console.error('[Import Pipeline]', err)
      }
    },
    [addChat, updateChat, setImportProgress]
  )

  return { runImport }
}
