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
