import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['onboarding_state']['Row']

export function createOnboardingStateRepository(db: SupabaseClient<Database>) {
  return {
    async findByUser(userId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('onboarding_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'onboarding_state'>): Promise<Row> {
      const { data, error } = await db
        .from('onboarding_state')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'onboarding_state'>): Promise<Row> {
      const { data, error } = await db
        .from('onboarding_state')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type OnboardingStateRepository = ReturnType<typeof createOnboardingStateRepository>
