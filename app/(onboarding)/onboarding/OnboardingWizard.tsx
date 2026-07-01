'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  INDUSTRIES,
  COMPANY_SIZES,
  COUNTRIES,
  CURRENCIES,
  BUSINESS_GOALS,
} from '@/config/onboarding'
import { ONBOARDING_STEPS, type OnboardingStep } from '@/types/onboarding'

type Props = {
  initialStep: OnboardingStep
  completedSteps: OnboardingStep[]
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  company_name: 'Company',
  industry: 'Industry',
  company_size: 'Team Size',
  country: 'Country',
  currency: 'Currency',
  business_goals: 'Goals',
  finish: 'Finish',
}

export function OnboardingWizard({ initialStep, completedSteps: initCompleted }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep)
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>(initCompleted)
  const [error, setError] = useState<string | null>(null)

  // Form values (each step has its own controlled field)
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [businessGoals, setBusinessGoals] = useState<string[]>([])

  const stepIndex = ONBOARDING_STEPS.indexOf(currentStep)
  const totalSteps = ONBOARDING_STEPS.length

  async function saveStep(step: OnboardingStep, data: Record<string, unknown>) {
    const res = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, data }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(String(json.error ?? 'Failed to save step.'))
    }
  }

  async function handleNext() {
    setError(null)
    try {
      let stepData: Record<string, unknown> = {}

      switch (currentStep) {
        case 'company_name':
          if (!companyName.trim()) { setError('Please enter your company name.'); return }
          stepData = { companyName: companyName.trim() }
          break
        case 'industry':
          if (!industry) { setError('Please select an industry.'); return }
          stepData = { industry }
          break
        case 'company_size':
          if (!companySize) { setError('Please select your team size.'); return }
          stepData = { companySize }
          break
        case 'country':
          if (!country) { setError('Please select your country.'); return }
          stepData = { country }
          break
        case 'currency':
          stepData = { currency }
          break
        case 'business_goals':
          if (businessGoals.length === 0) { setError('Please select at least one goal.'); return }
          stepData = { businessGoals }
          break
        default:
          break
      }

      if (currentStep !== 'welcome' && currentStep !== 'finish') {
        await saveStep(currentStep, stepData)
      }

      const newCompleted = Array.from(new Set([...completedSteps, currentStep]))
      setCompletedSteps(newCompleted as OnboardingStep[])

      const nextIndex = stepIndex + 1
      if (nextIndex < totalSteps) {
        setCurrentStep(ONBOARDING_STEPS[nextIndex]!)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function handleComplete() {
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      })
      if (!res.ok) throw new Error('Failed to complete onboarding.')
      startTransition(() => router.push('/dashboard'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const fieldClass =
    'w-full rounded-[1rem] border border-black/8 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-black/14 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]'
  const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400'
  const selectClass = fieldClass + ' cursor-pointer appearance-none'

  function toggleGoal(goal: string) {
    setBusinessGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {STEP_LABELS[currentStep]}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-950 transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[1.75rem] border border-black/6 bg-white p-8 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.1)]">
        {currentStep === 'welcome' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Welcome to MyBoss360
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Let&apos;s set up your Executive Workspace. It takes about 2 minutes.
              </p>
            </div>
            <Button
              onClick={handleNext}
              className="w-full rounded-full shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)]"
            >
              Get started
            </Button>
          </div>
        )}

        {currentStep === 'company_name' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                What&apos;s your company name?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This personalizes your Executive AI context.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="companyName" className={labelClass}>Company name</label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className={fieldClass}
                autoFocus
              />
            </div>
          </div>
        )}

        {currentStep === 'industry' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                What industry are you in?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Helps Executive AI surface relevant benchmarks and insights.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="industry" className={labelClass}>Industry</label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={selectClass}
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 'company_size' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                How large is your team?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Calibrates operational intelligence thresholds.
              </p>
            </div>
            <div className="space-y-2">
              {COMPANY_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setCompanySize(size.value)}
                  className={`w-full rounded-[1rem] border px-4 py-3 text-left text-sm transition-all duration-150 ${
                    companySize === size.value
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-black/8 bg-slate-50 text-slate-700 hover:border-black/14 hover:bg-white'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'country' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Where is your company based?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Used for regional intelligence and calendar context.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="country" className={labelClass}>Country</label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={selectClass}
              >
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 'currency' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Preferred currency?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pipeline values and revenue metrics will display in this currency.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="currency" className={labelClass}>Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={selectClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 'business_goals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                What are your top priorities?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Executive AI will focus recommendations on these goals.
              </p>
            </div>
            <div className="space-y-2">
              {BUSINESS_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`w-full rounded-[1rem] border px-4 py-2.5 text-left text-sm transition-all duration-150 ${
                    businessGoals.includes(goal)
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-black/8 bg-slate-50 text-slate-700 hover:border-black/14 hover:bg-white'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'finish' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Your workspace is ready.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Executive AI has your context loaded. Let&apos;s get to work.
              </p>
            </div>
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full rounded-full shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)]"
            >
              {isPending ? 'Opening dashboard…' : 'Enter dashboard'}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-[0.875rem] border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== 'welcome' && currentStep !== 'finish' && (
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const prevIndex = stepIndex - 1
                if (prevIndex >= 0) setCurrentStep(ONBOARDING_STEPS[prevIndex]!)
              }}
              className="flex-1 rounded-full border-black/8"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isPending}
              className="flex-1 rounded-full shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)]"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
