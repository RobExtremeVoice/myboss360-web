import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type MemoryRow = Database['public']['Tables']['memories']['Row']
type MemoryEventRow = Database['public']['Tables']['memory_events']['Row']

export function createMemoriesRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<MemoryRow | null> {
      const { data, error } = await db
        .from('memories')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(
      workspaceId: string,
      options: {
        type?: string | string[]
        entityType?: string | null
        entityId?: string | null
        userId?: string
        isPinned?: boolean
        limit?: number
        offset?: number
      } = {}
    ): Promise<MemoryRow[]> {
      let request = db
        .from('memories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.type) {
        if (Array.isArray(options.type)) {
          request = request.in('type', options.type)
        } else {
          request = request.eq('type', options.type)
        }
      }

      if (options.entityType !== undefined) {
        if (options.entityType === null) {
          request = request.is('entity_type', null)
        } else {
          request = request.eq('entity_type', options.entityType)
        }
      }

      if (options.entityId !== undefined) {
        if (options.entityId === null) {
          request = request.is('entity_id', null)
        } else {
          request = request.eq('entity_id', options.entityId)
        }
      }

      if (options.userId) {
        request = request.eq('user_id', options.userId)
      }

      if (options.isPinned !== undefined) {
        request = request.eq('is_pinned', options.isPinned)
      }

      request = request
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async listByOrg(
      organizationId: string,
      options: {
        type?: string | string[]
        limit?: number
      } = {}
    ): Promise<MemoryRow[]> {
      let request = db
        .from('memories')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (options.type) {
        if (Array.isArray(options.type)) {
          request = request.in('type', options.type)
        } else {
          request = request.eq('type', options.type)
        }
      }

      request = request
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'memories'>): Promise<MemoryRow> {
      const { data, error } = await db
        .from('memories')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'memories'>): Promise<MemoryRow> {
      const { data, error } = await db
        .from('memories')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('memories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async recordEvent(input: InsertTables<'memory_events'>): Promise<MemoryEventRow> {
      const { data, error } = await db
        .from('memory_events')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async listEvents(memoryId: string): Promise<MemoryEventRow[]> {
      const { data, error } = await db
        .from('memory_events')
        .select('*')
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  }
}

export type MemoriesRepository = ReturnType<typeof createMemoriesRepository>
