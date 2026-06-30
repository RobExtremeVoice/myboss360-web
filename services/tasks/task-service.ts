import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import { createLearningService } from '@/services/learning/learning-service'
import { emitTaskSignals } from '@/services/intelligence/signal-engine'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export function createTaskService(db: SupabaseClient<Database>) {
  const workspacesRepo = createWorkspacesRepository(db)

  async function resolveWorkspaceOrg(workspaceId: string) {
    const ws = await workspacesRepo.findById(workspaceId)
    return ws ? { workspaceId: ws.id, organizationId: ws.organization_id } : null
  }

  return {
    async listTasks(workspaceId: string): Promise<TaskRow[]> {
      const { data, error } = await db
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },

    async createTask(input: TaskInsert): Promise<TaskRow> {
      const { data, error } = await db
        .from('tasks')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      const task = data

      // Fire-and-forget: emit delay signal if task is already overdue on creation
      const context = await resolveWorkspaceOrg(task.workspace_id).catch(() => null)
      if (context) {
        void emitTaskSignals(task, context.workspaceId, context.organizationId, createLearningService(db))
      }

      return task
    },

    async updateTask(id: string, input: TaskUpdate): Promise<TaskRow> {
      const { data, error } = await db
        .from('tasks')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const task = data

      // Fire-and-forget: re-evaluate signals after status/due_date change
      const context = await resolveWorkspaceOrg(task.workspace_id).catch(() => null)
      if (context) {
        void emitTaskSignals(task, context.workspaceId, context.organizationId, createLearningService(db))
      }

      return task
    },

    async softDeleteTask(id: string): Promise<void> {
      const { error } = await db
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async getTask(id: string): Promise<TaskRow | null> {
      const { data, error } = await db
        .from('tasks')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },
  }
}

export type TaskService = ReturnType<typeof createTaskService>
