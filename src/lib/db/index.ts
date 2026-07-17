import { supabase } from '@/lib/supabase'
import type { Project, Chat, Message, VendorStatus } from '@/types'

// ─── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Chats ─────────────────────────────────────────────────────────────────────

export async function fetchChatsByProject(projectId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('project_id', projectId)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createChat(params: {
  projectId: string
  contactName: string
  vendorPhoneNumber: string
  lastMessageAt: string
  lastMessageSnippet: string
}): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      project_id: params.projectId,
      contact_name: params.contactName,
      vendor_phone_number: params.vendorPhoneNumber,
      status: 'None',
      internal_notes: '',
      last_message_at: params.lastMessageAt,
      last_message_snippet: params.lastMessageSnippet,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function findChatByName(projectId: string, contactName: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('project_id', projectId)
    .ilike('contact_name', contactName)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function findChatBySenderName(projectId: string, senderName: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*, messages!inner(sender_name)')
    .eq('project_id', projectId)
    .eq('messages.sender_name', senderName)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  
  // Clean up the joined messages array before returning as Chat
  const { messages, ...chat } = data as any
  return chat as Chat
}

export async function updateChatMeta(chatId: string, params: {
  lastMessageAt?: string
  lastMessageSnippet?: string
  status?: VendorStatus
  internalNotes?: string
  contactName?: string
  vendorPhoneNumber?: string
}): Promise<void> {
  const update: Record<string, string> = {}
  if (params.lastMessageAt) update.last_message_at = params.lastMessageAt
  if (params.lastMessageSnippet !== undefined) update.last_message_snippet = params.lastMessageSnippet
  if (params.status) update.status = params.status
  if (params.internalNotes !== undefined) update.internal_notes = params.internalNotes
  if (params.contactName) update.contact_name = params.contactName
  if (params.vendorPhoneNumber !== undefined) update.vendor_phone_number = params.vendorPhoneNumber

  const { error } = await supabase.from('chats').update(update).eq('id', chatId)
  if (error) throw error
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLastRealMessageTimestamp(chatId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('timestamp')
    .eq('chat_id', chatId)
    .eq('is_dummy_reply', false)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.timestamp ?? null
}

export async function bulkInsertMessages(
  messages: Omit<Message, 'id'>[]
): Promise<void> {
  if (messages.length === 0) return

  // Insert in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('messages').insert(batch)
    if (error) throw error
  }
}

export async function insertDummyReply(params: {
  chatId: string
  text: string
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: params.chatId,
      sender_name: 'Me',
      timestamp: new Date().toISOString(),
      text: params.text,
      has_attachment: false,
      attachment_url: null,
      is_system_message: false,
      is_dummy_reply: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function searchMessages(chatId: string, query: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .ilike('text', `%${query}%`)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function uploadMedia(
  chatId: string,
  fileName: string,
  data: Uint8Array,
  mimeType: string
): Promise<string | null> {
  const path = `${chatId}/${fileName}`

  const { error } = await supabase.storage
    .from('media')
    .upload(path, data, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    console.warn(`Failed to upload ${fileName}:`, error.message)
    return null
  }

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
  return urlData.publicUrl
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteChat(chatId: string): Promise<void> {
  // Messages and storage objects are NOT cascade-deleted automatically via SQL ON DELETE CASCADE
  // (storage is separate from postgres), so we delete messages first, then the chat
  const { error: msgErr } = await supabase.from('messages').delete().eq('chat_id', chatId)
  if (msgErr) throw msgErr

  const { error: chatErr } = await supabase.from('chats').delete().eq('id', chatId)
  if (chatErr) throw chatErr
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId)
  if (error) throw error
}
