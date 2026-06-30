import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, InsertTables, UpdateTables } from '@/types/database'

type MembershipRow = Database['public']['Tables']['memberships']['Row']

export function createMembershipsRepository(db: SupabaseClient<Database>) {
  return {
    async listByOrganization(
      organizationId: string
    ): Promise<MembershipRow[]> {
      const { data, error } = await db
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async listByUser(userId: string): Promise<MembershipRow[]> {
      const { data, error } = await db
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async create(input: InsertTables<'memberships'>): Promise<MembershipRow> {
      const { data, error } = await db
        .from('memberships')
        .insert([input])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(
      id: string,
      input: UpdateTables<'memberships'>
    ): Promise<MembershipRow> {
      const { data, error } = await db
        .from('memberships')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
  }
}

export type MembershipsRepository = ReturnType<
  typeof createMembershipsRepository
>
