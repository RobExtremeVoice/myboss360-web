import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables } from '@/types/database'

type Row = Database['public']['Tables']['crm_email_links']['Row']

export function createCrmEmailLinksRepository(db: SupabaseClient<Database>) {
  return {
    async listByThread(gmailThreadId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('crm_email_links')
        .select('*')
        .eq('gmail_thread_id', gmailThreadId)
        .order('confidence_score', { ascending: false })
      if (error) throw error
      return data ?? []
    },

    async syncForThread(
      gmailThreadId: string,
      inputs: InsertTables<'crm_email_links'>[]
    ): Promise<Row[]> {
      const existing = await this.listByThread(gmailThreadId)
      const keepKeys = new Set(inputs.map((item) => `${item.entity_type}:${item.entity_id}`))
      const staleIds = existing
        .filter((item) => !keepKeys.has(`${item.entity_type}:${item.entity_id}`))
        .map((item) => item.id)

      if (staleIds.length > 0) {
        const { error } = await db
          .from('crm_email_links')
          .delete()
          .in('id', staleIds)
        if (error) throw error
      }

      if (inputs.length === 0) {
        return []
      }

      const { data, error } = await db
        .from('crm_email_links')
        .upsert(inputs, { onConflict: 'gmail_thread_id,entity_type,entity_id' })
        .select()
      if (error) throw error
      return data ?? []
    },
  }
}

export type CrmEmailLinksRepository = ReturnType<typeof createCrmEmailLinksRepository>
