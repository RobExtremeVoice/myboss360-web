export type OnboardingStep =
  | 'welcome'
  | 'company_name'
  | 'industry'
  | 'company_size'
  | 'country'
  | 'currency'
  | 'business_goals'
  | 'finish'

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'company_name',
  'industry',
  'company_size',
  'country',
  'currency',
  'business_goals',
  'finish',
]

export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete'

export interface OnboardingState {
  id: string
  userId: string
  organizationId: string
  workspaceId: string
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkspaceSettings {
  id: string
  workspaceId: string
  companyName: string | null
  industry: string | null
  website: string | null
  country: string | null
  timezone: string
  language: string
  currency: string
  businessGoals: string[]
  createdAt: string
  updatedAt: string
}

export interface ExecutiveProfile {
  id: string
  userId: string
  workspaceId: string
  fullName: string | null
  roleTitle: string | null
  communicationStyle: string
  aiTone: string
  meetingStyle: string
  decisionStyle: string
  createdAt: string
  updatedAt: string
}

export interface ProvisionInput {
  userId: string
  userEmail: string
}

export interface ProvisionResult {
  organizationId: string
  workspaceId: string
  onboardingStateId: string
}

export interface OnboardingStatusResponse {
  status: OnboardingStatus
  currentStep: OnboardingStep | null
  completedSteps: OnboardingStep[]
  organizationId: string | null
  workspaceId: string | null
}

export interface SaveStepInput {
  step: OnboardingStep
  data: Record<string, unknown>
}

export interface CompleteOnboardingInput {
  loadDemoData: boolean
}
