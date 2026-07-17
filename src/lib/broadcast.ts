import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type BroadcastEvent =
  | { type: 'CHAT_UPDATED'; chatId: string; updates: Record<string, any> }
  | { type: 'MESSAGES_CHANGED'; chatId: string }
  | { type: 'CHAT_IMPORTED'; chatId: string }

let globalChannel: RealtimeChannel | null = null
let currentProjectId: string | null = null

export function getBroadcastChannel(projectId: string): RealtimeChannel {
  if (globalChannel && currentProjectId === projectId) {
    return globalChannel
  }
  
  if (globalChannel) {
    supabase.removeChannel(globalChannel)
  }
  
  currentProjectId = projectId
  globalChannel = supabase.channel(`project:${projectId}`)
  globalChannel.subscribe()
  return globalChannel
}

/**
 * Send a broadcast event to all other clients connected to the same project.
 */
export async function broadcastAction(projectId: string | null, event: BroadcastEvent) {
  if (!projectId) return
  const channel = getBroadcastChannel(projectId)
  
  // Wait a tiny bit if it's still connecting
  if (channel.state !== 'joined') {
    setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'sync',
        payload: event,
      })
    }, 500)
    return
  }

  await channel.send({
    type: 'broadcast',
    event: 'sync',
    payload: event,
  })
}
