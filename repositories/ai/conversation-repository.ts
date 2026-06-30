import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AIConversation } from '@/types/ai'
import { aiConfig } from '@/config/ai'

type Row = Database['public']['Tables']['ai_conversations']['Row']
type Insert = Database['public']['Tables']['ai_conversations']['Insert']
type Update = Database['public']['Tables']['ai_conversations']['Update']

function toConversation(row: Row): AIConversation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    organizationId: row.organization_id ?? null,
    userId: row.user_id,
    title: row.title,
    model: row.model,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

export function createConversationRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<AIConversation | null> {
      const { data, error } = await db
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data ? toConversation(data) : null
    },

    async listForUser(
      userId: string,
      workspaceId: string
    ): Promise<AIConversation[]> {
      const { data, error } = await db
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(aiConfig.maxConversationsToList)
      if (error) throw error
      return (data ?? []).map(toConversation)
    },

    async create(input: Insert): Promise<AIConversation> {
      const { data, error } = await db
        .from('ai_conversations')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return toConversation(data)
    },

    async update(id: string, input: Update): Promise<AIConversation> {
      const { data, error } = await db
        .from('ai_conversations')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return toConversation(data)
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('ai_conversations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async touchUpdatedAt(id: string): Promise<void> {
      const { error } = await db
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type ConversationRepository = ReturnType<typeof createConversationRepository>
