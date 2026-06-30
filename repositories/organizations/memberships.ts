import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['memberships']['Row']

export function createMembershipsRepository(db: SupabaseClient<Database>) {
  return {
    async listByOrg(organizationId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at')
      if (error) throw error
      return data
    },

    async listByWorkspace(workspaceId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('memberships')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at')
      if (error) throw error
      return data
    },

    async findByUser(userId: string, organizationId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .is('workspace_id', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'memberships'>): Promise<Row> {
      const { data, error } = await db
        .from('memberships')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'memberships'>): Promise<Row> {
      const { data, error } = await db
        .from('memberships')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async revoke(id: string): Promise<void> {
      const { error } = await db
        .from('memberships')
        .update({ status: 'suspended' })
        .eq('id', id)
      if (error) throw error
    },
  }
}

export type MembershipsRepository = ReturnType<typeof createMembershipsRepository>
