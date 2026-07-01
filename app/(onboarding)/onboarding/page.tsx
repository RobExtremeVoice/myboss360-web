import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOnboardingService } from '@/services/onboarding/onboarding-service'
import { createProvisioningService } from '@/services/onboarding/provisioning-service'
import { OnboardingWizard } from './OnboardingWizard'
import type { OnboardingStep } from '@/types/onboarding'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminDb = createAdminClient()
  const service = createOnboardingService(adminDb)
  let status = await service.getStatus(user.id)

  // Auto-provision if this is the user's first visit
  if (status.status === 'not_started') {
    const provisioning = createProvisioningService(adminDb)
    await provisioning.provisionWorkspace({ userId: user.id, userEmail: user.email ?? '' })
    status = await service.getStatus(user.id)
  }

  // Already completed → go to dashboard
  if (status.status === 'complete') redirect('/dashboard')

  return (
    <OnboardingWizard
      initialStep={(status.currentStep ?? 'welcome') as OnboardingStep}
      completedSteps={(status.completedSteps ?? []) as OnboardingStep[]}
    />
  )
}
