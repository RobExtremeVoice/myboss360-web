import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['learning_signals']['Row']

export function createSignalsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('learning_signals')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(
      workspaceId: string,
      options: {
        signalType?: string
        entityType?: string
        entityId?: string
        severity?: string
        resolved?: boolean
        limit?: number
      } = {}
    ): Promise<Row[]> {
      let request = db
        .from('learning_signals')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (options.signalType) {
        request = request.eq('signal_type', options.signalType)
      }

      if (options.entityType) {
        request = request.eq('entity_type', options.entityType)
      }

      if (options.entityId) {
        request = request.eq('entity_id', options.entityId)
      }

      if (options.severity) {
        request = request.eq('severity', options.severity)
      }

      if (options.resolved === false) {
        request = request.is('resolved_at', null)
      } else if (options.resolved === true) {
        request = request.not('resolved_at', 'is', null)
      }

      request = request.order('detected_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'learning_signals'>): Promise<Row> {
      const { data, error } = await db
        .from('learning_signals')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async resolve(id: string): Promise<Row> {
      const { data, error } = await db
        .from('learning_signals')
        .update({
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'learning_signals'>): Promise<Row> {
      const { data, error } = await db
        .from('learning_signals')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type SignalsRepository = ReturnType<typeof createSignalsRepository>
