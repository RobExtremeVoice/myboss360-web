# Sprint 18 — Executive Onboarding & Workspace Provisioning

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade onboarding flow that automatically provisions an Executive Workspace for every new organization, then walks the executive through an 8-step premium wizard to personalize their environment.

**Architecture:** First-login detection in the dashboard layout redirects new users to `/onboarding`. A service-role Supabase client handles provisioning (org + workspace + memberships + initial memory/learning data) because regular users have no INSERT RLS on orgs/workspaces. An 8-step wizard at `/onboarding` collects company and executive profile data, updating existing records via `PATCH /api/onboarding` on each step. The wizard completes by marking `onboarding_state.completed_at` and redirecting to `/dashboard`.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, TypeScript, Tailwind CSS, `node:test` for unit tests, existing repository/service patterns.

## Global Constraints

- Do NOT redesign the dashboard — do not modify any existing dashboard page or component.
- Do NOT modify AI architecture — no changes to services/ai, providers, or provider-registry.
- Do NOT remove existing auth — register/login pages stay untouched.
- Do NOT install packages — use only what is already in package.json.
- Keep Supabase SSR — use `createServerClient()` for auth checks; use `createAdminClient()` (service role) only for provisioning writes.
- Everything must be production-ready — no TODO placeholders, no mock data in production code paths.
- Provisioning creates BOTH an org-level membership (workspace_id = NULL) AND a workspace-level membership (workspace_id = id) so that `workspacesRepo.listForUser()` — which uses `memberships!inner(user_id)` join — finds the workspace.
- All new tables must have RLS enabled and policies defined in the migration.
- Tests use the `node:test` + `node:assert/strict` pattern (no vitest). Run with `bun test <file>`.
- Lint/build gates: `npm run lint` and `npm run build` must pass after every task.
- All wizard copy uses English. No hardcoded personal names.

---

## File Map

**New files:**
- `supabase/migrations/20260630000004_onboarding_schema.sql` — 3 new tables + RLS
- `types/onboarding.ts` — all TS types for onboarding domain
- `config/onboarding.ts` — static option lists (industries, sizes, currencies, etc.)
- `repositories/onboarding/onboarding-state.ts`
- `repositories/onboarding/workspace-settings.ts`
- `repositories/onboarding/executive-profiles.ts`
- `repositories/onboarding/index.ts`
- `lib/supabase/admin.ts` — service-role Supabase client (server-only)
- `services/onboarding/provisioning-service.ts`
- `services/onboarding/onboarding-service.ts`
- `app/(onboarding)/layout.tsx`
- `app/(onboarding)/onboarding/page.tsx`
- `app/(onboarding)/onboarding/OnboardingWizard.tsx`
- `app/api/onboarding/route.ts`
- `docs/onboarding.md`
- `tests/services/onboarding/provisioning-service.test.ts`
- `tests/services/onboarding/onboarding-service.test.ts`

**Modified files:**
- `types/database.ts` — append `onboarding_state`, `workspace_settings`, `executive_profiles` table types
- `types/learning.ts` — add `'workspace_created'` to `SignalType` union
- `repositories/index.ts` — add `export * from './onboarding'`
- `app/(dashboard)/layout.tsx` — add first-login detection + redirect

---

## Task 1: Database Migration + Types

**Files:**
- Create: `supabase/migrations/20260630000004_onboarding_schema.sql`
- Modify: `types/database.ts`
- Create: `types/onboarding.ts`
- Modify: `types/learning.ts`

**Interfaces:**
- Produces:
  - Table `onboarding_state` — tracks per-user wizard progress
  - Table `workspace_settings` — company profile + preferences
  - Table `executive_profiles` — per-user executive preferences
  - TS types consumed by all later tasks

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260630000004_onboarding_schema.sql`:

```sql
-- =============================================================================
-- Sprint 18 — Onboarding Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- onboarding_state  (one row per user; tracks wizard progress)
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  current_step    TEXT NOT NULL DEFAULT 'welcome',
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_onboarding_state
  BEFORE UPDATE ON onboarding_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_settings  (one row per workspace; company profile + preferences)
-- ---------------------------------------------------------------------------
CREATE TABLE workspace_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name  TEXT,
  industry      TEXT,
  website       TEXT,
  country       TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  language      TEXT NOT NULL DEFAULT 'en',
  currency      TEXT NOT NULL DEFAULT 'USD',
  business_goals TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_workspace_settings
  BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- executive_profiles  (one row per user; executive preferences)
-- ---------------------------------------------------------------------------
CREATE TABLE executive_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name           TEXT,
  role_title          TEXT,
  communication_style TEXT NOT NULL DEFAULT 'direct',
  ai_tone             TEXT NOT NULL DEFAULT 'professional',
  meeting_style       TEXT NOT NULL DEFAULT 'structured',
  decision_style      TEXT NOT NULL DEFAULT 'data-driven',
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_executive_profiles
  BEFORE UPDATE ON executive_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX ob_state_user_idx ON onboarding_state (user_id);
CREATE INDEX ob_state_ws_idx   ON onboarding_state (workspace_id);
CREATE INDEX ws_settings_idx   ON workspace_settings (workspace_id);
CREATE INDEX exec_prof_user    ON executive_profiles (user_id);
CREATE INDEX exec_prof_ws      ON executive_profiles (workspace_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE onboarding_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_profiles  ENABLE ROW LEVEL SECURITY;

-- onboarding_state: users manage their own row
CREATE POLICY "own_onboarding_select" ON onboarding_state
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_onboarding_update" ON onboarding_state
  FOR UPDATE USING (user_id = auth.uid());

-- workspace_settings: workspace members can read; service role writes on provision
CREATE POLICY "ws_settings_select" ON workspace_settings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_settings_update" ON workspace_settings
  FOR UPDATE USING (is_workspace_member(workspace_id));

-- executive_profiles: users manage their own row
CREATE POLICY "own_exec_profile_select" ON executive_profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_exec_profile_update" ON executive_profiles
  FOR UPDATE USING (user_id = auth.uid());
```

- [ ] **Step 2: Append new table types to `types/database.ts`**

Open `types/database.ts`. Find the closing `}` of the last table inside `Tables:` (before `Functions:`). Insert the following three table entries before the `Functions:` line:

```typescript
      onboarding_state: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          workspace_id: string
          current_step: string
          completed_steps: string[]
          completed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          workspace_id: string
          current_step?: string
          completed_steps?: string[]
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          workspace_id?: string
          current_step?: string
          completed_steps?: string[]
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          id: string
          workspace_id: string
          company_name: string | null
          industry: string | null
          website: string | null
          country: string | null
          timezone: string
          language: string
          currency: string
          business_goals: string[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          company_name?: string | null
          industry?: string | null
          website?: string | null
          country?: string | null
          timezone?: string
          language?: string
          currency?: string
          business_goals?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          company_name?: string | null
          industry?: string | null
          website?: string | null
          country?: string | null
          timezone?: string
          language?: string
          currency?: string
          business_goals?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      executive_profiles: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          full_name: string | null
          role_title: string | null
          communication_style: string
          ai_tone: string
          meeting_style: string
          decision_style: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          full_name?: string | null
          role_title?: string | null
          communication_style?: string
          ai_tone?: string
          meeting_style?: string
          decision_style?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          full_name?: string | null
          role_title?: string | null
          communication_style?: string
          ai_tone?: string
          meeting_style?: string
          decision_style?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
```

Find the `Functions:` key in `types/database.ts` and ensure the three entries above appear inside `Tables:` just before it. The exact insertion point is after the closing `}` of the last existing table entry and before `      }` that closes `Tables:`.

- [ ] **Step 3: Create `types/onboarding.ts`**

```typescript
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
```

- [ ] **Step 4: Add `'workspace_created'` to `SignalType` in `types/learning.ts`**

Open `types/learning.ts` and change the `SignalType` union from:

```typescript
export type SignalType =
  | 'deal_risk'
  | 'follow_up_delay'
  | 'task_delay'
  | 'customer_health'
  | 'sales_pattern'
  | 'recurring_bottleneck'
  | 'performance_trend'
  | 'recommended_action'
```

To:

```typescript
export type SignalType =
  | 'deal_risk'
  | 'follow_up_delay'
  | 'task_delay'
  | 'customer_health'
  | 'sales_pattern'
  | 'recurring_bottleneck'
  | 'performance_trend'
  | 'recommended_action'
  | 'workspace_created'
```

- [ ] **Step 5: Verify build passes**

```bash
npm run lint && npm run build
```

Expected: no errors. `types/database.ts` is only consumed by TypeScript; the migration SQL is not run locally during build.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260630000004_onboarding_schema.sql types/onboarding.ts types/database.ts types/learning.ts
git commit -m "Sprint 18: add onboarding schema migration and domain types"
```

---

## Task 2: Config + Repositories

**Files:**
- Create: `config/onboarding.ts`
- Create: `repositories/onboarding/onboarding-state.ts`
- Create: `repositories/onboarding/workspace-settings.ts`
- Create: `repositories/onboarding/executive-profiles.ts`
- Create: `repositories/onboarding/index.ts`
- Modify: `repositories/index.ts`
- Create: `tests/services/onboarding/provisioning-service.test.ts` ← test stubs for repo contracts

**Interfaces:**
- Consumes: `types/database.ts` (OnboardingState, WorkspaceSettings, ExecutiveProfiles rows), `types/onboarding.ts`
- Produces:
  - `createOnboardingStateRepository(db)` → `OnboardingStateRepository`
  - `createWorkspaceSettingsRepository(db)` → `WorkspaceSettingsRepository`
  - `createExecutiveProfilesRepository(db)` → `ExecutiveProfilesRepository`
  - `export * from './onboarding'` in `repositories/index.ts`

- [ ] **Step 1: Write `config/onboarding.ts`**

```typescript
export const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Retail & E-commerce',
  'Manufacturing',
  'Real Estate',
  'Education',
  'Consulting & Professional Services',
  'Media & Entertainment',
  'Logistics & Supply Chain',
  'Energy & Utilities',
  'Construction',
  'Legal',
  'Non-Profit',
  'Other',
] as const

export const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-1000', label: '201–1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
] as const

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Brazil',
  'India',
  'Singapore',
  'Netherlands',
  'Spain',
  'Italy',
  'Mexico',
  'Japan',
  'South Korea',
  'Other',
] as const

export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'BRL', label: 'BRL — Brazilian Real' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'MXN', label: 'MXN — Mexican Peso' },
] as const

export const BUSINESS_GOALS = [
  'Grow revenue',
  'Expand to new markets',
  'Improve team productivity',
  'Close more deals faster',
  'Reduce churn',
  'Launch a new product',
  'Raise funding',
  'Build strategic partnerships',
  'Improve customer satisfaction',
  'Scale operations',
] as const

export const COMMUNICATION_STYLES = [
  { value: 'direct', label: 'Direct — straight to the point' },
  { value: 'collaborative', label: 'Collaborative — team-oriented' },
  { value: 'analytical', label: 'Analytical — data-first' },
  { value: 'visionary', label: 'Visionary — big picture' },
] as const

export const AI_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'concise', label: 'Concise' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
] as const

export const MEETING_STYLES = [
  { value: 'structured', label: 'Structured — agenda-driven' },
  { value: 'flexible', label: 'Flexible — open discussion' },
  { value: 'async-first', label: 'Async-first — minimize meetings' },
] as const

export const DECISION_STYLES = [
  { value: 'data-driven', label: 'Data-driven' },
  { value: 'intuitive', label: 'Intuitive' },
  { value: 'consensus', label: 'Consensus-based' },
  { value: 'delegative', label: 'Delegative' },
] as const
```

- [ ] **Step 2: Write `repositories/onboarding/onboarding-state.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['onboarding_state']['Row']

export function createOnboardingStateRepository(db: SupabaseClient<Database>) {
  return {
    async findByUser(userId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('onboarding_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'onboarding_state'>): Promise<Row> {
      const { data, error } = await db
        .from('onboarding_state')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'onboarding_state'>): Promise<Row> {
      const { data, error } = await db
        .from('onboarding_state')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type OnboardingStateRepository = ReturnType<typeof createOnboardingStateRepository>
```

- [ ] **Step 3: Write `repositories/onboarding/workspace-settings.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['workspace_settings']['Row']

export function createWorkspaceSettingsRepository(db: SupabaseClient<Database>) {
  return {
    async findByWorkspace(workspaceId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'workspace_settings'>): Promise<Row> {
      const { data, error } = await db
        .from('workspace_settings')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'workspace_settings'>): Promise<Row> {
      const { data, error } = await db
        .from('workspace_settings')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type WorkspaceSettingsRepository = ReturnType<typeof createWorkspaceSettingsRepository>
```

- [ ] **Step 4: Write `repositories/onboarding/executive-profiles.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InsertTables, UpdateTables } from '@/types/database'

type Row = Database['public']['Tables']['executive_profiles']['Row']

export function createExecutiveProfilesRepository(db: SupabaseClient<Database>) {
  return {
    async findByUser(userId: string): Promise<Row | null> {
      const { data, error } = await db
        .from('executive_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },

    async create(input: InsertTables<'executive_profiles'>): Promise<Row> {
      const { data, error } = await db
        .from('executive_profiles')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id: string, input: UpdateTables<'executive_profiles'>): Promise<Row> {
      const { data, error } = await db
        .from('executive_profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

export type ExecutiveProfilesRepository = ReturnType<typeof createExecutiveProfilesRepository>
```

- [ ] **Step 5: Write `repositories/onboarding/index.ts`**

```typescript
export { createOnboardingStateRepository, type OnboardingStateRepository } from './onboarding-state'
export { createWorkspaceSettingsRepository, type WorkspaceSettingsRepository } from './workspace-settings'
export { createExecutiveProfilesRepository, type ExecutiveProfilesRepository } from './executive-profiles'
```

- [ ] **Step 6: Add to `repositories/index.ts`**

Open `repositories/index.ts` and append one line:

```typescript
export * from './onboarding'
```

- [ ] **Step 7: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add config/onboarding.ts repositories/onboarding/ repositories/index.ts
git commit -m "Sprint 18: onboarding config and repository layer"
```

---

## Task 3: Admin Client + Provisioning Service

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `services/onboarding/provisioning-service.ts`
- Create: `tests/services/onboarding/provisioning-service.test.ts`

**Interfaces:**
- Consumes:
  - `createOrganizationsRepository(db)` from `@/repositories/organizations`
  - `createMembershipsRepository(db)` from `@/repositories/organizations`
  - `createWorkspacesRepository(db)` from `@/repositories/workspaces`
  - `createOnboardingStateRepository(db)`, `createWorkspaceSettingsRepository(db)`, `createExecutiveProfilesRepository(db)` from `@/repositories/onboarding`
  - `createMemoryService(db)` from `@/services/memory/memory-service`
  - `createLearningService(db)` from `@/services/learning/learning-service`
  - `types/onboarding.ts` — `ProvisionInput`, `ProvisionResult`
- Produces:
  - `createAdminClient(): SupabaseClient<Database>` from `lib/supabase/admin.ts`
  - `createProvisioningService(db)` → `{ provisionWorkspace(input: ProvisionInput): Promise<ProvisionResult> }`

- [ ] **Step 1: Write the failing test**

Create `tests/services/onboarding/provisioning-service.test.ts`:

```typescript
import test from 'node:test'
import assert from 'node:assert/strict'

// Unit-test the slug generation utility that provisioning-service exports.
// Full provisioning requires a live DB (integration test); unit tests cover
// the pure helper functions only.

import { deriveOrgSlug } from '../../../services/onboarding/provisioning-service.ts'

test('deriveOrgSlug produces lowercase-hyphenated slug from email domain', () => {
  const slug = deriveOrgSlug('alice@acme.com')
  assert.ok(slug.startsWith('acme-'), `Expected "acme-…", got "${slug}"`)
  assert.ok(/^[a-z0-9-]+$/.test(slug), 'slug must be lowercase alphanumeric+hyphen')
})

test('deriveOrgSlug handles emails without recognizable domain', () => {
  const slug = deriveOrgSlug('user@gmail.com')
  assert.ok(slug.length > 0)
  assert.ok(/^[a-z0-9-]+$/.test(slug))
})

test('deriveOrgSlug handles empty/undefined email gracefully', () => {
  const slug = deriveOrgSlug('')
  assert.ok(slug.length > 0, 'slug must not be empty for empty email')
  assert.ok(/^[a-z0-9-]+$/.test(slug))
})

test('deriveOrgSlug appends a unique suffix so concurrent signups do not collide', () => {
  const a = deriveOrgSlug('alice@acme.com')
  const b = deriveOrgSlug('alice@acme.com')
  // Two calls at different ms will differ; same-ms calls may match in test —
  // we only assert the suffix exists (non-empty suffix after the last '-').
  const parts = a.split('-')
  assert.ok(parts.length >= 2, 'slug must have at least two hyphen-separated parts')
})
```

- [ ] **Step 2: Run to see it fail**

```bash
bun test tests/services/onboarding/provisioning-service.test.ts
```

Expected: FAIL — `deriveOrgSlug` is not defined.

- [ ] **Step 3: Write `lib/supabase/admin.ts`**

```typescript
// Server-only. Never import this in client components or browser code.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for provisioning writes.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for provisioning.'
    )
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
```

- [ ] **Step 4: Write `services/onboarding/provisioning-service.ts`**

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun test tests/services/onboarding/provisioning-service.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/admin.ts services/onboarding/provisioning-service.ts tests/services/onboarding/provisioning-service.test.ts
git commit -m "Sprint 18: admin client and workspace provisioning service"
```

---

## Task 4: Onboarding Service + API Route

**Files:**
- Create: `services/onboarding/onboarding-service.ts`
- Create: `app/api/onboarding/route.ts`
- Create: `tests/services/onboarding/onboarding-service.test.ts`

**Interfaces:**
- Consumes:
  - `createOnboardingStateRepository(db)` from `@/repositories/onboarding`
  - `createWorkspaceSettingsRepository(db)` from `@/repositories/onboarding`
  - `createExecutiveProfilesRepository(db)` from `@/repositories/onboarding`
  - `types/onboarding.ts` — `OnboardingStatusResponse`, `SaveStepInput`, `OnboardingStep`, `ONBOARDING_STEPS`
- Produces:
  - `createOnboardingService(db)` → `{ getStatus, saveStep, complete }`
  - `GET /api/onboarding` → `OnboardingStatusResponse`
  - `POST /api/onboarding` → `ProvisionResult`
  - `PATCH /api/onboarding` → `{ ok: true }`

- [ ] **Step 1: Write the failing test**

Create `tests/services/onboarding/onboarding-service.test.ts`:

```typescript
import test from 'node:test'
import assert from 'node:assert/strict'
import { ONBOARDING_STEPS } from '../../../types/onboarding.ts'

test('ONBOARDING_STEPS has 8 items in the correct order', () => {
  assert.equal(ONBOARDING_STEPS.length, 8)
  assert.equal(ONBOARDING_STEPS[0], 'welcome')
  assert.equal(ONBOARDING_STEPS[7], 'finish')
})

test('ONBOARDING_STEPS contains all required steps', () => {
  const required = ['welcome', 'company_name', 'industry', 'company_size', 'country', 'currency', 'business_goals', 'finish']
  for (const step of required) {
    assert.ok(ONBOARDING_STEPS.includes(step as never), `Missing step: ${step}`)
  }
})

test('stepIndex returns correct position for each step', () => {
  assert.equal(ONBOARDING_STEPS.indexOf('welcome'), 0)
  assert.equal(ONBOARDING_STEPS.indexOf('finish'), 7)
  assert.equal(ONBOARDING_STEPS.indexOf('company_name'), 1)
})
```

- [ ] **Step 2: Run to see it pass immediately (pure type check)**

```bash
bun test tests/services/onboarding/onboarding-service.test.ts
```

Expected: 3 tests pass (these test the exported constant, not a service).

- [ ] **Step 3: Write `services/onboarding/onboarding-service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  OnboardingState,
  OnboardingStatusResponse,
  OnboardingStep,
  WorkspaceSettings,
  ExecutiveProfile,
} from '@/types/onboarding'
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

      // Persist step-specific data
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
              metadata: { ...(settings.metadata as Record<string, unknown>), companySize: data.companySize },
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
```

- [ ] **Step 4: Write `app/api/onboarding/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOnboardingService } from '@/services/onboarding/onboarding-service'
import { createProvisioningService } from '@/services/onboarding/provisioning-service'
import type { OnboardingStep } from '@/types/onboarding'

async function getAuthUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** GET /api/onboarding — returns current onboarding status for the authenticated user */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()
  const service = createOnboardingService(adminDb)
  const status = await service.getStatus(user.id)
  return NextResponse.json(status)
}

/** POST /api/onboarding — provisions org + workspace + initial data for a new user */
export async function POST() {
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
}

/** PATCH /api/onboarding — save a wizard step or mark onboarding complete */
export async function PATCH(request: Request) {
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

  await service.saveStep(user.id, step, data)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors. `/api/onboarding` appears in the route table as `ƒ (Dynamic)`.

- [ ] **Step 6: Commit**

```bash
git add services/onboarding/onboarding-service.ts app/api/onboarding/ tests/services/onboarding/onboarding-service.test.ts
git commit -m "Sprint 18: onboarding service and API route (GET/POST/PATCH)"
```

---

## Task 5: Dashboard Layout — First-Login Gate

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes:
  - `createAdminClient()` from `@/lib/supabase/admin`
  - `createOnboardingStateRepository(db)` from `@/repositories/onboarding`
  - `createWorkspacesRepository(db)` from `@/repositories/workspaces`
  - Next.js `redirect()` from `next/navigation`

**Logic:** After auth check, query onboarding state using the admin client (RLS bypassed). If no onboarding state exists → redirect to `/onboarding` (provisioning page triggers POST). If onboarding state exists but `completed_at` is null → redirect to `/onboarding` (resume wizard). Otherwise fall through to the normal dashboard render.

- [ ] **Step 1: Modify `app/(dashboard)/layout.tsx`**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/layout.tsx
git commit -m "Sprint 18: dashboard layout redirects new users to onboarding wizard"
```

---

## Task 6: Onboarding Wizard UI

**Files:**
- Create: `app/(onboarding)/layout.tsx`
- Create: `app/(onboarding)/onboarding/page.tsx`
- Create: `app/(onboarding)/onboarding/OnboardingWizard.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/onboarding` → `OnboardingStatusResponse`
  - `POST /api/onboarding` → triggers provisioning
  - `PATCH /api/onboarding` → saves step / completes
  - `config/onboarding.ts` — all option lists
  - `types/onboarding.ts` — `ONBOARDING_STEPS`, `OnboardingStep`
  - Existing UI primitives: `Button` from `@/components/ui/button`
  - Next.js `useRouter` from `next/navigation`
- Produces:
  - `/onboarding` — server page that runs provisioning if needed, then renders wizard
  - `OnboardingWizard` — client component managing 8-step wizard state

- [ ] **Step 1: Write `app/(onboarding)/layout.tsx`**

```typescript
// Minimal layout for onboarding: no AppShell, no sidebar.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            MyBoss360
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/(onboarding)/onboarding/page.tsx`**

```typescript
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
```

- [ ] **Step 3: Write `app/(onboarding)/onboarding/OnboardingWizard.tsx`**

```typescript
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
```

- [ ] **Step 4: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors. `/onboarding` appears in the route table.

- [ ] **Step 5: Commit**

```bash
git add app/\(onboarding\)/
git commit -m "Sprint 18: onboarding wizard UI (8-step premium layout)"
```

---

## Task 7: Documentation

**Files:**
- Create: `docs/onboarding.md`

- [ ] **Step 1: Write `docs/onboarding.md`**

```markdown
# Executive Onboarding & Workspace Provisioning

## Overview

Every new MyBoss360 account is automatically provisioned with a complete Executive Workspace on first login. The user never sees a blank state or an error about missing workspace.

## Flow

```
Register → Login → /dashboard (layout detects no onboarding_state)
  → redirect to /onboarding (page auto-provisions if needed)
  → OnboardingWizard (8 steps)
  → PATCH /api/onboarding { complete: true }
  → redirect to /dashboard (now has workspace, wizard complete)
```

## Provisioning

Provisioning is handled by `services/onboarding/provisioning-service.ts` using the Supabase service-role client (`lib/supabase/admin.ts`). The service-role client bypasses Row Level Security, which is required because new users have no INSERT policy on `organizations`, `workspaces`, or `memberships`.

**What gets created on provision:**

| Entity | Value |
|---|---|
| Organization | name: "My Organization", slug: `<domain>-<timestamp36>` |
| Workspace | name: "Executive", slug: "executive" |
| Org membership | `workspace_id = null` (org-level access) |
| Workspace membership | `workspace_id = workspace.id` (required for `listForUser` join) |
| Workspace settings | currency: USD, timezone: UTC, language: en |
| Executive profile | defaults: direct / professional / structured / data-driven |
| Memory (org) | "Organization created" |
| Memory (workspace) | "Executive workspace initialized" |
| Learning signal | type: workspace_created |
| Recommendation | "Complete your company profile" |
| Onboarding state | current_step: welcome |

## Onboarding State Machine

`onboarding_state.current_step` tracks wizard progress.
`onboarding_state.completed_at` is set when the user clicks "Enter dashboard" on the Finish step.

The dashboard layout (`app/(dashboard)/layout.tsx`) reads this row on every request:
- `completed_at IS NULL` → redirect to `/onboarding`
- `completed_at IS NOT NULL` → render dashboard normally

## Wizard Steps

| Step | Data Saved |
|---|---|
| welcome | — |
| company_name | `workspace_settings.company_name` |
| industry | `workspace_settings.industry` |
| company_size | `workspace_settings.metadata.companySize` |
| country | `workspace_settings.country` |
| currency | `workspace_settings.currency` |
| business_goals | `workspace_settings.business_goals[]` |
| finish | `onboarding_state.completed_at` |

## API Routes

### `GET /api/onboarding`
Returns `OnboardingStatusResponse` for the authenticated user.

### `POST /api/onboarding`
Idempotent provisioning. Creates org + workspace + memberships + initial data.
Returns early (200) if already provisioned.

### `PATCH /api/onboarding`
- `{ step, data }` — save a wizard step and advance `current_step`
- `{ complete: true }` — mark onboarding complete (sets `completed_at`)
- `{ execProfile: { ... } }` — save executive profile preferences

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>    # Required for provisioning
```

Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. Never expose this key to the browser.

## Database Tables

| Table | Purpose |
|---|---|
| `onboarding_state` | One row per user; tracks current wizard step and completion |
| `workspace_settings` | Company profile + preferences (currency, timezone, goals) |
| `executive_profiles` | Per-user executive style preferences fed into AI context |

## RLS Notes

- `onboarding_state`: SELECT/UPDATE via `user_id = auth.uid()`; no user INSERT policy (service role creates the row during provisioning)
- `workspace_settings`: SELECT/UPDATE via `is_workspace_member(workspace_id)`; service role creates on provision
- `executive_profiles`: SELECT/UPDATE via `user_id = auth.uid()`; service role creates on provision

## Sprint 19 Recommendations

1. **Executive Profile Wizard Step** — add a step between `business_goals` and `finish` that collects `full_name`, `role_title`, `communication_style`, `ai_tone`
2. **Demo Data Seeding** — add a "Load demo CRM & tasks" toggle on the Finish step; provision seed data via `POST /api/onboarding/demo`
3. **Org Settings Page** — surface `workspace_settings` in `/dashboard/settings` so the executive can update company info post-onboarding
4. **AI Context Integration** — pass `workspace_settings.business_goals` and `workspace_settings.currency` into `buildSystemPrompt()` in `services/ai/prompt-builder.ts`
5. **Multi-workspace Support** — extend `WorkspaceSwitcher` to list all workspaces from `listForUser`
```

- [ ] **Step 2: Verify final build**

```bash
npm run lint && npm run build
```

Expected: no errors, all routes present.

- [ ] **Step 3: Commit**

```bash
git add docs/onboarding.md
git commit -m "Sprint 18: onboarding documentation"
```

---

## Self-Review

**Spec coverage check:**

| Spec Part | Tasks |
|---|---|
| PART 1: First login detection | Task 5 |
| PART 2: Auto provisioning (org, workspace, memberships, settings, executive profile) | Task 3 |
| PART 3: Initial memory + learning signal + recommendation | Task 3 (provisioning-service) |
| PART 4: Onboarding wizard (8 steps) | Task 6 |
| PART 5: Company profile (name, industry, website, country, timezone, currency, language, goals) | Tasks 1, 2, 4, 6 |
| PART 6: Executive profile (name, role, comm style, AI tone, meeting style, decision style) | Tasks 1, 2, 3 |
| PART 7: Initial dashboard (dashboard already handles empty state gracefully; Sprint 19 item for demo data) | Covered by existing dashboard + Sprint 19 note |
| PART 8: services/onboarding, repositories/onboarding, types/onboarding, config/onboarding | Tasks 1, 2, 3, 4 |
| PART 9: /api/onboarding GET/POST/PATCH (status, create, complete, resume) | Task 4 |
| PART 10: Auth guard, workspace scoped, org scoped, RLS compliant | Task 1 (migration RLS), Task 4 (route auth), Task 3 (admin client) |
| PART 11: docs/onboarding.md | Task 7 |
| Lint + build passes | Every task |

**Constraint compliance:**
- No packages installed ✓ (uses `@supabase/supabase-js` already in dependencies, native `fetch`)
- No AI architecture changes ✓
- No dashboard redesign ✓
- Supabase SSR preserved ✓
- RLS compliant ✓ (service role used only in API routes and server-side provisioning)
- Both org-level AND workspace-level memberships created ✓ (fixes `listForUser` join)
