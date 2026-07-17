import JSZip from 'jszip'
import { parseChatText } from './chat-parser'
import type { ParsedChat, ParsedMessage } from '@/types'

/**
 * Extract and parse a WhatsApp Export ZIP file
 *
 * Returns:
 * - parsed: ParsedChat with all messages
 * - mediaFiles: Map<filename, Uint8Array> for all media files
 * - chatFileName: the _chat.txt file name found
 */
export interface ZipParseResult {
  parsed: ParsedChat
  mediaFiles: Map<string, Uint8Array>
  hasChat: boolean
}

export async function parseZipFile(file: File): Promise<ZipParseResult> {
  const zip = new JSZip()
  const loaded = await zip.loadAsync(file)

  // Find _chat.txt (always the case for Mac Desktop exports)
  const chatFile = Object.values(loaded.files).find(
    (f) => !f.dir && f.name.endsWith('_chat.txt')
  )

  if (!chatFile) {
    return {
      parsed: { messages: [] },
      mediaFiles: new Map(),
      hasChat: false,
    }
  }

  // Parse chat text
  const rawText = await chatFile.async('string')
  const messages: ParsedMessage[] = parseChatText(rawText)

  // Extract all media files
  const mediaFiles = new Map<string, Uint8Array>()
  const mediaPromises: Promise<void>[] = []

  for (const [relativePath, zipEntry] of Object.entries(loaded.files)) {
    if (zipEntry.dir) continue
    if (relativePath.endsWith('_chat.txt')) continue

    // Get the basename only (no subfolders)
    const baseName = relativePath.split('/').pop() ?? relativePath

    mediaPromises.push(
      zipEntry.async('uint8array').then((data) => {
        mediaFiles.set(baseName, data)
      })
    )
  }

  await Promise.all(mediaPromises)

  return {
    parsed: { messages },
    mediaFiles,
    hasChat: true,
  }
}
