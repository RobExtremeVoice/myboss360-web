import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, InsertTables, UpdateTables } from '@/types/database'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

export function createWorkspacesRepository(db: SupabaseClient<Database>) {
  return {
    async listByOrganization(
      organizationId: string
    ): Promise<WorkspaceRow[]> {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data
    },

    async listForUser(userId: string): Promise<WorkspaceRow[]> {
      const { data: memberships, error: membershipsError } = await db
        .from('memberships')
        .select('workspace_id, organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (membershipsError) throw membershipsError

      const directWorkspaceIds = Array.from(
        new Set(
          memberships
            .map((membership) => membership.workspace_id)
            .filter((value): value is string => Boolean(value))
        )
      )

      const orgMembershipIds = Array.from(
        new Set(
          memberships
            .filter((membership) => membership.workspace_id === null)
            .map((membership) => membership.organization_id)
        )
      )

      const selectors: WorkspaceRow[] = []

      if (directWorkspaceIds.length > 0) {
        const { data, error } = await db
          .from('workspaces')
          .select('*')
          .in('id', directWorkspaceIds)
          .is('deleted_at', null)
          .order('name')

        if (error) throw error
        selectors.push(...data)
      }

      if (orgMembershipIds.length > 0) {
        const { data, error } = await db
          .from('workspaces')
          .select('*')
          .in('organization_id', orgMembershipIds)
          .is('deleted_at', null)
          .order('name')

        if (error) throw error
        selectors.push(...data)
      }

      const deduped = new Map<string, WorkspaceRow>()
      for (const workspace of selectors) {
        deduped.set(workspace.id, workspace)
      }

      return Array.from(deduped.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    },

    async findById(id: string): Promise<WorkspaceRow | null> {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data
    },

    async create(input: InsertTables<'workspaces'>): Promise<WorkspaceRow> {
      const { data, error } = await db
        .from('workspaces')
        .insert([input])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(
      id: string,
      input: UpdateTables<'workspaces'>
    ): Promise<WorkspaceRow> {
      const { data, error } = await db
        .from('workspaces')
        .update(input)
        .eq('id', id)
        .select()
        .single()

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
