import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  OnboardingState,
  OnboardingStatusResponse,
  OnboardingStep,
  WorkspaceSettings,
  ExecutiveProfile,
} from '@/types/onboarding'
import type { Json } from '@/types/database'
import {
  createOnboardingStateRepository,
  createWorkspaceSettingsRepository,
  createExecutiveProfilesRepository,
} from '@/repositories/onboarding'

type StateRow = Database['public']['Tables']['onboarding_state']['Row']
type SettingsRow = Database['public']['Tables']['workspace_settings']['Row']
type ProfileRow = Database['public']['Tables']['executive_profiles']['Row']

function toState(row: StateRow): OnboardingState {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id,
    currentStep: row.current_step as OnboardingStep,
    completedSteps: row.completed_steps as OnboardingStep[],
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSettings(row: SettingsRow): WorkspaceSettings {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyName: row.company_name,
    industry: row.industry,
    website: row.website,
    country: row.country,
    timezone: row.timezone,
    language: row.language,
    currency: row.currency,
    businessGoals: row.business_goals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProfile(row: ProfileRow): ExecutiveProfile {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    fullName: row.full_name,
    roleTitle: row.role_title,
    communicationStyle: row.communication_style,
    aiTone: row.ai_tone,
    meetingStyle: row.meeting_style,
    decisionStyle: row.decision_style,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createOnboardingService(db: SupabaseClient<Database>) {
  const stateRepo = createOnboardingStateRepository(db)
  const settingsRepo = createWorkspaceSettingsRepository(db)
  const profilesRepo = createExecutiveProfilesRepository(db)

  return {
    async getStatus(userId: string): Promise<OnboardingStatusResponse> {
      const row = await stateRepo.findByUser(userId)
      if (!row) {
        return { status: 'not_started', currentStep: null, completedSteps: [], organizationId: null, workspaceId: null }
      }
      const state = toState(row)
      return {
        status: state.completedAt ? 'complete' : 'in_progress',
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        organizationId: state.organizationId,
        workspaceId: state.workspaceId,
      }
    },

    async saveStep(
      userId: string,
      step: OnboardingStep,
      data: Record<string, unknown>
    ): Promise<void> {
      const row = await stateRepo.findByUser(userId)
      if (!row) throw new Error('Onboarding state not found. Provision workspace first.')

      const state = toState(row)
      const completedSteps = Array.from(new Set([...state.completedSteps, step]))
      const stepOrder: OnboardingStep[] = [
        'welcome', 'company_name', 'industry', 'company_size',
        'country', 'currency', 'business_goals', 'finish',
      ]
      const nextIndex = stepOrder.indexOf(step) + 1
      const nextStep: OnboardingStep = nextIndex < stepOrder.length
        ? stepOrder[nextIndex]!
        : 'finish'

      // Persist step-specific data to workspace_settings
      switch (step) {
        case 'company_name': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, { company_name: String(data.companyName ?? '') })
          }
          break
        }
        case 'industry': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, { industry: String(data.industry ?? '') })
          }
          break
        }
        case 'company_size': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, {
              metadata: { ...(settings.metadata as Record<string, Json>), companySize: data.companySize as Json },
            })
          }
          break
        }
        case 'country': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, { country: String(data.country ?? '') })
          }
          break
        }
        case 'currency': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, { currency: String(data.currency ?? 'USD') })
          }
          break
        }
        case 'business_goals': {
          const settings = await settingsRepo.findByWorkspace(state.workspaceId)
          if (settings) {
            await settingsRepo.update(settings.id, {
              business_goals: Array.isArray(data.businessGoals) ? data.businessGoals as string[] : [],
            })
          }
          break
        }
        default:
          break
      }

      await stateRepo.update(row.id, {
        current_step: nextStep,
        completed_steps: completedSteps,
      })
    },

    async complete(userId: string): Promise<void> {
      const row = await stateRepo.findByUser(userId)
      if (!row) throw new Error('Onboarding state not found.')
      await stateRepo.update(row.id, {
        completed_at: new Date().toISOString(),
        current_step: 'finish',
      })
    },

    async getSettings(workspaceId: string): Promise<WorkspaceSettings | null> {
      const row = await settingsRepo.findByWorkspace(workspaceId)
      return row ? toSettings(row) : null
    },

    async getExecutiveProfile(userId: string): Promise<ExecutiveProfile | null> {
      const row = await profilesRepo.findByUser(userId)
      return row ? toProfile(row) : null
    },

    async saveExecutiveProfile(
      userId: string,
      data: {
        fullName?: string
        roleTitle?: string
        communicationStyle?: string
        aiTone?: string
        meetingStyle?: string
        decisionStyle?: string
      }
    ): Promise<void> {
      const row = await profilesRepo.findByUser(userId)
      if (!row) throw new Error('Executive profile not found.')
      await profilesRepo.update(row.id, {
        full_name: data.fullName ?? row.full_name,
        role_title: data.roleTitle ?? row.role_title,
        communication_style: data.communicationStyle ?? row.communication_style,
        ai_tone: data.aiTone ?? row.ai_tone,
        meeting_style: data.meetingStyle ?? row.meeting_style,
        decision_style: data.decisionStyle ?? row.decision_style,
      })
    },
  }
}

export type OnboardingService = ReturnType<typeof createOnboardingService>
