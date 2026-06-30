import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { IntelligenceContext } from '@/types/intelligence'
import { createIntelligenceService } from '@/services/intelligence/intelligence-service'

// Loads the full executive intelligence context for the current user/workspace.
// The AI must not query business tables directly — it always reads through this loader.
export async function loadExecutiveContext(
  db: SupabaseClient<Database>,
  userId: string,
  workspaceId?: string
): Promise<IntelligenceContext | null> {
  const intelligenceService = createIntelligenceService(db)
  return intelligenceService.getIntelligenceContext(userId, workspaceId)
}
