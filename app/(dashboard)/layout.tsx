import { redirect } from 'next/navigation'

import { AppShell } from '@/components/dashboard/AppShell'
import { AuthProvider } from '@/providers/AuthProvider'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOnboardingStateRepository } from '@/repositories/onboarding'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // First-login gate: check onboarding state with admin client (bypasses RLS)
  const adminDb = createAdminClient()
  const stateRepo = createOnboardingStateRepository(adminDb)
  const onboardingState = await stateRepo.findByUser(user.id)

  if (!onboardingState || !onboardingState.completed_at) {
    // Not started or wizard in progress → redirect to onboarding
    redirect('/onboarding')
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
