import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createLearningService } from '@/services/learning/learning-service'
import { emitProjectSignals } from '@/services/intelligence/signal-engine'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export function createProjectService(db: SupabaseClient<Database>) {
  const workspacesRepo = createWorkspacesRepository(db)

  async function resolveWorkspaceOrg(workspaceId: string) {
    const ws = await workspacesRepo.findById(workspaceId)
    return ws ? { workspaceId: ws.id, organizationId: ws.organization_id } : null
  }

  return {
    async listProjects(workspaceId: string): Promise<ProjectRow[]> {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },

    async createProject(input: ProjectInsert): Promise<ProjectRow> {
      const { data, error } = await db
        .from('projects')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      const project = data

      // Fire-and-forget: emit signals for at-risk project
      const context = await resolveWorkspaceOrg(project.workspace_id).catch(() => null)
      if (context) {
        void emitProjectSignals(project, context.workspaceId, context.organizationId, createLearningService(db))
      }

      return project
    },

    async updateProject(id: string, input: ProjectUpdate): Promise<ProjectRow> {
      const { data, error } = await db
        .from('projects')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const project = data

      // Fire-and-forget: re-evaluate on status change
      const context = await resolveWorkspaceOrg(project.workspace_id).catch(() => null)
      if (context) {
        void emitProjectSignals(project, context.workspaceId, context.organizationId, createLearningService(db))
      }

      return project
    },

    async softDeleteProject(id: string): Promise<void> {
      const { error } = await db
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async getProject(id: string): Promise<ProjectRow | null> {
      const { data, error } = await db
        .from('projects')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },
  }
}

export type ProjectService = ReturnType<typeof createProjectService>
