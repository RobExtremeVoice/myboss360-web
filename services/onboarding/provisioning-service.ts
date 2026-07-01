import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ProvisionInput, ProvisionResult } from '@/types/onboarding'
import { createOrganizationsRepository } from '@/repositories/organizations'
import { createMembershipsRepository } from '@/repositories/organizations'
import { createWorkspacesRepository } from '@/repositories/workspaces'
import {
  createOnboardingStateRepository,
  createWorkspaceSettingsRepository,
  createExecutiveProfilesRepository,
} from '@/repositories/onboarding'
import { createMemoryService } from '@/services/memory/memory-service'
import { createLearningService } from '@/services/learning/learning-service'

// Common free-email domains whose org name should fall back to 'my-org'
const FREE_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'])

/** Derives a URL-safe org slug from the user's email domain. */
export function deriveOrgSlug(email: string): string {
  const domain = email.split('@')[1] ?? ''
  const base = FREE_DOMAINS.has(domain)
    ? 'my-org'
    : domain.split('.')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-org'
  const suffix = Date.now().toString(36)
  return `${base}-${suffix}`
}

export function createProvisioningService(db: SupabaseClient<Database>) {
  const orgsRepo = createOrganizationsRepository(db)
  const membershipsRepo = createMembershipsRepository(db)
  const workspacesRepo = createWorkspacesRepository(db)
  const stateRepo = createOnboardingStateRepository(db)
  const settingsRepo = createWorkspaceSettingsRepository(db)
  const profilesRepo = createExecutiveProfilesRepository(db)
  const memoryService = createMemoryService(db)
  const learningService = createLearningService(db)

  return {
    async provisionWorkspace(input: ProvisionInput): Promise<ProvisionResult> {
      // 1. Create organization
      const org = await orgsRepo.create({
        name: 'My Organization',
        slug: deriveOrgSlug(input.userEmail),
        plan: 'free',
      })

      // 2. Create workspace
      const workspace = await workspacesRepo.create({
        organization_id: org.id,
        name: 'Executive',
        slug: 'executive',
        description: 'Executive workspace',
      })

      // 3. Org-level membership (workspace_id = null → access to all workspaces in org)
      await membershipsRepo.create({
        user_id: input.userId,
        organization_id: org.id,
        workspace_id: null,
        status: 'active',
        joined_at: new Date().toISOString(),
      })

      // 4. Workspace-level membership (needed for listForUser inner join)
      await membershipsRepo.create({
        user_id: input.userId,
        organization_id: org.id,
        workspace_id: workspace.id,
        status: 'active',
        joined_at: new Date().toISOString(),
      })

      // 5. Default workspace settings
      await settingsRepo.create({
        workspace_id: workspace.id,
        currency: 'USD',
        timezone: 'UTC',
        language: 'en',
      })

      // 6. Default executive profile
      await profilesRepo.create({
        user_id: input.userId,
        workspace_id: workspace.id,
        communication_style: 'direct',
        ai_tone: 'professional',
        meeting_style: 'structured',
        decision_style: 'data-driven',
      })

      // 7. Initial memories
      await memoryService.createMemory({
        workspaceId: workspace.id,
        organizationId: org.id,
        type: 'workspace_context',
        title: 'Organization created',
        content: 'Organization created. Executive workspace initialized.',
        source: 'system',
        entityType: 'organization',
        entityId: org.id,
        createdBy: input.userId,
      })

      await memoryService.createMemory({
        workspaceId: workspace.id,
        organizationId: org.id,
        type: 'org_goal',
        title: 'Executive workspace initialized',
        content: 'Executive workspace is ready. Business context will populate as data is added.',
        source: 'system',
        entityType: 'workspace',
        entityId: workspace.id,
        createdBy: input.userId,
      })

      // 8. Learning signal
      await learningService.createLearningSignal({
        workspaceId: workspace.id,
        organizationId: org.id,
        signalType: 'workspace_created',
        entityType: 'workspace',
        entityId: workspace.id,
        severity: 'info',
        title: 'Executive workspace created',
        description: 'New executive workspace provisioned. Onboarding in progress.',
      })

      // 9. Initial recommendation
      await learningService.createRecommendation({
        workspaceId: workspace.id,
        organizationId: org.id,
        userId: input.userId,
        type: 'action',
        priority: 'high',
        title: 'Complete your company profile',
        description: 'Add your company name, industry, and business goals so Executive AI can deliver relevant insights.',
        actionLabel: 'Complete profile',
        actionUrl: '/onboarding',
      })

      // 10. Create onboarding state
      const state = await stateRepo.create({
        user_id: input.userId,
        organization_id: org.id,
        workspace_id: workspace.id,
        current_step: 'welcome',
        completed_steps: [],
      })

      return {
        organizationId: org.id,
        workspaceId: workspace.id,
        onboardingStateId: state.id,
      }
    },
  }
}

export type ProvisioningService = ReturnType<typeof createProvisioningService>
