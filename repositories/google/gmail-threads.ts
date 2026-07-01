import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type ThreadRow = Database['public']['Tables']['gmail_threads']['Row']
type MessageRow = Database['public']['Tables']['gmail_messages']['Row']

// ─── Threads ──────────────────────────────────────────────────────────────────

export function createGmailThreadsRepository(db: SupabaseClient<Database>) {
  return {
    async findByGoogleThreadId(connectionId: string, threadId: string): Promise<ThreadRow | null> {
      const { data, error } = await db
        .from('gmail_threads')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('thread_id', threadId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<ThreadRow | null> {
      const { data, error } = await db
        .from('gmail_threads')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByWorkspace(
      workspaceId: string,
      options: {
        status?: string
        limit?: number
        offset?: number
      } = {}
    ): Promise<ThreadRow[]> {
      let q = db
        .from('gmail_threads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('latest_reply_at', { ascending: false })

      if (options.status) q = q.eq('status', options.status)
      if (options.limit) q = q.limit(options.limit)
      if (options.offset) q = q.range(options.offset, options.offset + (options.limit ?? 50) - 1)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'gmail_threads'>): Promise<ThreadRow> {
      const { data, error } = await db
        .from('gmail_threads')
        .upsert(input, { onConflict: 'connection_id,thread_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'gmail_threads'>): Promise<ThreadRow> {
      const { data, error } = await db
        .from('gmail_threads')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await db.from('gmail_threads').delete().eq('id', id)
      if (error) throw error
    },
  }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function createGmailMessagesRepository(db: SupabaseClient<Database>) {
  return {
    async findByMessageId(connectionId: string, messageId: string): Promise<MessageRow | null> {
      const { data, error } = await db
        .from('gmail_messages')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('message_id', messageId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByThread(gmailThreadId: string): Promise<MessageRow[]> {
      const { data, error } = await db
        .from('gmail_messages')
        .select('*')
        .eq('gmail_thread_id', gmailThreadId)
        .order('sent_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'gmail_messages'>): Promise<MessageRow> {
      const { data, error } = await db
        .from('gmail_messages')
        .upsert(input, { onConflict: 'connection_id,message_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async upsertMany(inputs: InsertTables<'gmail_messages'>[]): Promise<MessageRow[]> {
      if (inputs.length === 0) return []
      const { data, error } = await db
        .from('gmail_messages')
        .upsert(inputs, { onConflict: 'connection_id,message_id' })
        .select()
      if (error) throw error
      return data ?? []
    },

    async deleteByThread(gmailThreadId: string): Promise<void> {
      const { error } = await db
        .from('gmail_messages')
        .delete()
        .eq('gmail_thread_id', gmailThreadId)
      if (error) throw error
    },
  }
}

export type GmailThreadsRepository = ReturnType<typeof createGmailThreadsRepository>
export type GmailMessagesRepository = ReturnType<typeof createGmailMessagesRepository>
