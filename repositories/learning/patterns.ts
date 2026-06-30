import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['learning_patterns']['Row']

export function createPatternsRepository(db: SupabaseClient<Database>) {
  return {
    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('learning_patterns')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async findByTypeAndName(
      workspaceId: string,
      patternType: string,
      name: string
    ): Promise<Row | null> {
      const { data, error } = await db
        .from('learning_patterns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('pattern_type', patternType)
        .eq('name', name)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async list(
      workspaceId: string,
      options: {
        patternType?: string
        minConfidence?: number
        limit?: number
      } = {}
    ): Promise<Row[]> {
      let request = db
        .from('learning_patterns')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (options.patternType) {
        request = request.eq('pattern_type', options.patternType)
      }

      if (options.minConfidence !== undefined) {
        request = request.gte('confidence', options.minConfidence)
      }

      request = request
        .order('confidence', { ascending: false })
        .order('occurrences', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'learning_patterns'>): Promise<Row> {
      const { data, error } = await db
        .from('learning_patterns')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'learning_patterns'>): Promise<Row> {
      const { data, error } = await db
        .from('learning_patterns')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async incrementOccurrences(id: string, newConfidence: number): Promise<Row> {
      const existing = await this.findById(id)
      if (!existing) throw new Error(`Pattern not found: ${id}`)
      const { data, error } = await db
        .from('learning_patterns')
        .update({
          occurrences: existing.occurrences + 1,
          confidence: newConfidence,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type PatternsRepository = ReturnType<typeof createPatternsRepository>
