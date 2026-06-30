import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, InsertTables, UpdateTables } from '@/types/database'

type OrganizationRow = Database['public']['Tables']['organizations']['Row']

export function createOrganizationsRepository(db: SupabaseClient<Database>) {
  return {
    async listForUser(userId: string): Promise<OrganizationRow[]> {
      const { data: memberships, error: membershipsError } = await db
        .from('memberships')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (membershipsError) throw membershipsError

      const organizationIds = Array.from(
        new Set(
          memberships
            .map((membership) => membership.organization_id)
            .filter((value): value is string => Boolean(value))
        )
      )

      if (organizationIds.length === 0) {
        return []
      }

      const { data, error } = await db
        .from('organizations')
        .select('*')
        .in('id', organizationIds)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data
    },

    async findById(id: string): Promise<OrganizationRow | null> {
      const { data, error } = await db
        .from('organizations')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data
    },

    async create(
      input: InsertTables<'organizations'>
    ): Promise<OrganizationRow> {
      const { data, error } = await db
        .from('organizations')
        .insert([input])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(
      id: string,
      input: UpdateTables<'organizations'>
    ): Promise<OrganizationRow> {
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

export type OrganizationsRepository = ReturnType<
  typeof createOrganizationsRepository
>
