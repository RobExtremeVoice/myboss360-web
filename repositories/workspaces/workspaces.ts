import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['workspaces']['Row']

export function createWorkspacesRepository(db: SupabaseClient<Database>) {
  return {
    async listByOrg(organizationId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('name')
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findBySlug(organizationId: string, slug: string): Promise<Row | null> {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'workspaces'>): Promise<Row> {
      const { data, error } = await db
        .from('workspaces')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'workspaces'>): Promise<Row> {
      const { data, error } = await db
        .from('workspaces')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    // Returns workspaces the user belongs to via their memberships
    async listForUser(userId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('workspaces')
        .select('*, memberships!inner(user_id)')
        .eq('memberships.user_id', userId)
        .is('deleted_at', null)
        .order('name')
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('workspaces')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type WorkspacesRepository = ReturnType<typeof createWorkspacesRepository>
