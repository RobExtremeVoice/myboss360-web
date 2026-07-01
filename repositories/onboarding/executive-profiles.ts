import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['executive_profiles']['Row']

export function createExecutiveProfilesRepository(db: SupabaseClient<Database>) {
  return {
    async findByUser(userId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('executive_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'executive_profiles'>): Promise<Row> {
      const { data, error } = await db
        .from('executive_profiles')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'executive_profiles'>): Promise<Row> {
      const { data, error } = await db
        .from('executive_profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type ExecutiveProfilesRepository = ReturnType<typeof createExecutiveProfilesRepository>
