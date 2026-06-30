import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['organizations']['Row']

export function createOrganizationsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('organizations')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findBySlug(slug: string): Promise<Row | null> {
      const { data, error } = await db
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'organizations'>): Promise<Row> {
      const { data, error } = await db
        .from('organizations')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'organizations'>): Promise<Row> {
      const { data, error } = await db
        .from('organizations')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('organizations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>
