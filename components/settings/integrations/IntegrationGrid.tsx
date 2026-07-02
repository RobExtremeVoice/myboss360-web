import { INTEGRATION_CATEGORIES } from '@/config/integrations'
import type { IntegrationCategory, IntegrationState } from '@/types/integrations'
import { IntegrationCard } from './IntegrationCard'

type Props = {
  states: IntegrationState[]
  workspaceId: string
}

/** Canonical display order for integration categories. */
const CATEGORY_ORDER: IntegrationCategory[] = [
  'google_workspace',
  'microsoft_365',
  'crm',
  'communication',
  'ai_providers',
]

export function IntegrationGrid({ states, workspaceId }: Props) {
  // Group states by category, preserving canonical order.
  const grouped = CATEGORY_ORDER.reduce<Record<IntegrationCategory, IntegrationState[]>>(
    (acc, cat) => {
      acc[cat] = states.filter((s) => s.definition.category === cat)
      return acc
    },
    {} as Record<IntegrationCategory, IntegrationState[]>,
  )

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category]
        if (items.length === 0) return null

        const label = INTEGRATION_CATEGORIES[category] ?? category

        return (
          <section key={category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((state) => (
                <IntegrationCard
                  key={state.definition.id}
                  state={state}
                  workspaceId={workspaceId}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
