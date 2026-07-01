import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type TokenRow = Database['public']['Tables']['google_tokens']['Row']

export function createGoogleTokensRepository(db: SupabaseClient<Database>) {
  return {
    async findByConnectionId(connectionId: string): Promise<TokenRow | null> {
      const { data, error } = await db
        .from('google_tokens')
        .select('*')
        .eq('connection_id', connectionId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async upsert(input: InsertTables<'google_tokens'>): Promise<TokenRow> {
      const { data, error } = await db
        .from('google_tokens')
        .upsert(input, { onConflict: 'connection_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(connectionId: string, input: UpdateTables<'google_tokens'>): Promise<TokenRow> {
      const { data, error } = await db
        .from('google_tokens')
        .update(input)
        .eq('connection_id', connectionId)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async deleteByConnectionId(connectionId: string): Promise<void> {
      const { error } = await db
        .from('google_tokens')
        .delete()
        .eq('connection_id', connectionId)
      if (error) throw error
    },
  }
}

export type GoogleTokensRepository = ReturnType<typeof createGoogleTokensRepository>
