import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['profiles']['Row']

export function createProfilesRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async listByIds(ids: string[]): Promise<Row[]> {
      if (ids.length === 0) return []
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .in('id', ids)
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'profiles'>): Promise<Row> {
      const { data, error } = await db
        .from('profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type ProfilesRepository = ReturnType<typeof createProfilesRepository>
