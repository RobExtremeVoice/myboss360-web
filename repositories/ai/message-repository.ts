import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AIMessage, AIRole } from '@/types/ai'
import { aiConfig } from '@/config/ai'

type Row = Database['public']['Tables']['ai_messages']['Row']
type Insert = Database['public']['Tables']['ai_messages']['Insert']

function toMessage(row: Row): AIMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as AIRole,
    content: row.content,
    tokensUsed: row.tokens_used,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }
}

export function createMessageRepository(db: SupabaseClient<Database>) {
  return {
    async listByConversation(conversationId: string): Promise<AIMessage[]> {
      const { data, error } = await db
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(aiConfig.maxMessagesPerConversation)
      if (error) throw error
      return (data ?? []).map(toMessage)
    },

    async create(input: Insert): Promise<AIMessage> {
      const { data, error } = await db
        .from('ai_messages')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return toMessage(data)
    },

    async getLastN(conversationId: string, n: number): Promise<AIMessage[]> {
      const { data, error } = await db
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(n)
      if (error) throw error
      return (data ?? []).reverse().map(toMessage)
    },
  }
}

export type MessageRepository = ReturnType<typeof createMessageRepository>
