import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['activities']['Row']

export function createActivitiesRepository(db: SupabaseClient<Database>) {
  return {
    async listByWorkspace(
      workspaceId: string,
      options: {
        query?: string
        limit?: number
      } = {}
    ): Promise<Row[]> {
      let request = db
        .from('activities')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (options.query) {
        request = request.or(
          `title.ilike.%${options.query}%,body.ilike.%${options.query}%,type.ilike.%${options.query}%`
        )
      }

      request = request.order('occurred_at', { ascending: false })

      if (options.limit) {
        request = request.limit(options.limit)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async listByDeal(dealId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('occurred_at', { ascending: false })
      if (error) throw error
      return data
    },

    async listByContact(contactId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('occurred_at', { ascending: false })
      if (error) throw error
      return data
    },

    async listByCompany(companyId: string): Promise<Row[]> {
      const { data, error } = await db
        .from('activities')
        .select('*')
        .eq('company_id', companyId)
        .order('occurred_at', { ascending: false })
      if (error) throw error
      return data
    },

    async findById(id: string): Promise<Row | null> {
      const { data, error } = await db
        .from('activities')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'activities'>): Promise<Row> {
      const { data, error } = await db
        .from('activities')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'activities'>): Promise<Row> {
      const { data, error } = await db
        .from('activities')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type ActivitiesRepository = ReturnType<typeof createActivitiesRepository>
