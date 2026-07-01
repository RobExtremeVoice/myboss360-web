import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type GmailContactRow = Database['public']['Tables']['gmail_contacts']['Row']
type ParticipantRow = Database['public']['Tables']['gmail_thread_participants']['Row']

// ─── Gmail Contacts ───────────────────────────────────────────────────────────

export function createGmailContactsRepository(db: SupabaseClient<Database>) {
  return {
    async findByEmail(connectionId: string, email: string): Promise<GmailContactRow | null> {
      const { data, error } = await db
        .from('gmail_contacts')
        .select('*')
        .eq('connection_id', connectionId)
        .ilike('email', email)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<GmailContactRow | null> {
      const { data, error } = await db
        .from('gmail_contacts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByWorkspace(workspaceId: string, options: { limit?: number } = {}): Promise<GmailContactRow[]> {
      let q = db
        .from('gmail_contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_seen_at', { ascending: false })
      if (options.limit) q = q.limit(options.limit)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },

    async listUnmatched(workspaceId: string): Promise<GmailContactRow[]> {
      const { data, error } = await db
        .from('gmail_contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('crm_contact_id', null)
        .order('message_count', { ascending: false })
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'gmail_contacts'>): Promise<GmailContactRow> {
      const { data, error } = await db
        .from('gmail_contacts')
        .upsert(input, { onConflict: 'connection_id,email' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'gmail_contacts'>): Promise<GmailContactRow> {
      const { data, error } = await db
        .from('gmail_contacts')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    // Increment message_count and update last_seen_at in one call.
    async recordSeen(connectionId: string, email: string, countDelta: number): Promise<void> {
      const existing = await this.findByEmail(connectionId, email)
      if (!existing) return
      await this.update(existing.id, {
        message_count: existing.message_count + countDelta,
        last_seen_at: new Date().toISOString(),
      })
    },

    async linkToCrm(id: string, crmContactId: string): Promise<GmailContactRow> {
      return this.update(id, { crm_contact_id: crmContactId })
    },
  }
}

// ─── Thread Participants ──────────────────────────────────────────────────────

export function createGmailParticipantsRepository(db: SupabaseClient<Database>) {
  return {
    async listByThread(gmailThreadId: string): Promise<ParticipantRow[]> {
      const { data, error } = await db
        .from('gmail_thread_participants')
        .select('*')
        .eq('gmail_thread_id', gmailThreadId)
      if (error) throw error
      return data ?? []
    },

    async upsert(input: InsertTables<'gmail_thread_participants'>): Promise<ParticipantRow> {
      const { data, error } = await db
        .from('gmail_thread_participants')
        .upsert(input, { onConflict: 'gmail_thread_id,gmail_contact_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(
      gmailThreadId: string,
      gmailContactId: string,
      input: UpdateTables<'gmail_thread_participants'>
    ): Promise<ParticipantRow> {
      const { data, error } = await db
        .from('gmail_thread_participants')
        .update(input)
        .eq('gmail_thread_id', gmailThreadId)
        .eq('gmail_contact_id', gmailContactId)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type GmailContactsRepository = ReturnType<typeof createGmailContactsRepository>
export type GmailParticipantsRepository = ReturnType<typeof createGmailParticipantsRepository>
