import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOnboardingService } from '@/services/onboarding/onboarding-service'
import { createProvisioningService } from '@/services/onboarding/provisioning-service'
import { ONBOARDING_STEPS } from '@/types/onboarding'
import type { OnboardingStep } from '@/types/onboarding'

async function getAuthUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** GET /api/onboarding — returns current onboarding status for the authenticated user */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()
    const service = createOnboardingService(adminDb)
    const status = await service.getStatus(user.id)
    return NextResponse.json(status)
  } catch (err) {
    console.error('[onboarding] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

/** POST /api/onboarding — provisions org + workspace + initial data for a new user */
export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminDb = createAdminClient()

    // Idempotency: if already provisioned, return existing state
    const service = createOnboardingService(adminDb)
    const existing = await service.getStatus(user.id)
    if (existing.status !== 'not_started') {
      return NextResponse.json(existing, { status: 200 })
    }

    const provisioningService = createProvisioningService(adminDb)
    const result = await provisioningService.provisionWorkspace({
      userId: user.id,
      userEmail: user.email ?? '',
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[onboarding] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

/** PATCH /api/onboarding — save a wizard step or mark onboarding complete */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const adminDb = createAdminClient()
    const service = createOnboardingService(adminDb)

    if (body.complete === true) {
      await service.complete(user.id)
      return NextResponse.json({ ok: true })
    }

    if (body.execProfile) {
      await service.saveExecutiveProfile(user.id, body.execProfile)
      return NextResponse.json({ ok: true })
    }

    const step = body.step as OnboardingStep | undefined
    const data = (body.data ?? {}) as Record<string, unknown>

    if (!step) {
      return NextResponse.json({ error: 'Missing step or complete flag.' }, { status: 400 })
    }

    // Finding 1: validate step before calling saveStep to prevent silent wizard reset
    if (!ONBOARDING_STEPS.includes(step as OnboardingStep)) {
      return NextResponse.json({ error: 'Invalid step.' }, { status: 400 })
    }

    await service.saveStep(user.id, step, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[onboarding] PATCH error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
