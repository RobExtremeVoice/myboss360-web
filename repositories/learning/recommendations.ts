import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type RecommendationRow = Database['public']['Tables']['recommendations']['Row']
type FeedbackRow = Database['public']['Tables']['recommendation_feedback']['Row']

export function createRecommendationsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<RecommendationRow | null> {
      const { data, error } = await db
        .from('recommendations')
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
        userId?: string
        status?: string | string[]
        type?: string
        priority?: string
        entityType?: string
        entityId?: string
        limit?: number
      } = {}
    ): Promise<RecommendationRow[]> {
      let request = db
        .from('recommendations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (options.userId) {
        request = request.eq('user_id', options.userId)
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          request = request.in('status', options.status)
        } else {
          request = request.eq('status', options.status)
        }
      }

      if (options.type) {
        request = request.eq('type', options.type)
      }

      if (options.priority) {
        request = request.eq('priority', options.priority)
      }

      if (options.entityType) {
        request = request.eq('entity_type', options.entityType)
      }

      if (options.entityId) {
        request = request.eq('entity_id', options.entityId)
      }

      request = request.order('created_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'recommendations'>): Promise<RecommendationRow> {
      const { data, error } = await db
        .from('recommendations')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'recommendations'>): Promise<RecommendationRow> {
      const { data, error } = await db
        .from('recommendations')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async updateStatus(id: string, status: string): Promise<RecommendationRow> {
      const { data, error } = await db
        .from('recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await db
        .from('recommendations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },

    async createFeedback(input: InsertTables<'recommendation_feedback'>): Promise<FeedbackRow> {
      const { data, error } = await db
        .from('recommendation_feedback')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async listFeedback(recommendationId: string): Promise<FeedbackRow[]> {
      const { data, error } = await db
        .from('recommendation_feedback')
        .select('*')
        .eq('recommendation_id', recommendationId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  }
}

export type RecommendationsRepository = ReturnType<typeof createRecommendationsRepository>
