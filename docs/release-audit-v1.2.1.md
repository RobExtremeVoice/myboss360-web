# Release Audit — v1.2.1

> Generated: 2026-07-01 | Sprint: 20.9 Architecture Freeze & Engineering Excellence
> 
> This document summarizes the state of the platform at release v1.2.1. It is the authoritative pre-release checklist against which v1.3 development begins.

---

## 1. Architecture Summary

### Module Inventory

| Layer | Modules | Notes |
|---|---|---|
| **App Router (Pages)** | `(auth)/`, `(dashboard)/`, `(marketing)/`, `(onboarding)/` | All auth-gated pages server-rendered by default |
| **API Routes** | `ai/`, `calendar/`, `executive/`, `gmail/`, `google/`, `intelligence/`, `knowledge/`, `onboarding/`, `people/` | All routes perform Supabase `getUser()` auth check |
| **Services** | `ai/`, `crm/`, `dashboard/`, `google/`, `intelligence/`, `knowledge/`, `learning/`, `memory/`, `onboarding/`, `people/` | Business logic layer; no direct DB calls in components |
| **Repositories** | `crm/`, `knowledge/`, `onboarding/`, `users/`, `workspaces/` | Typed wrappers over Supabase queries |
| **Infrastructure** | `lib/supabase/` (browser/server/admin), `lib/dates.ts`, `utils/formatters.ts` | Shared utilities, no business logic |
| **Types** | `ai.ts`, `crm.ts`, `database.ts`, `executive.ts`, `intelligence.ts`, `knowledge.ts`, `learning.ts`, `memory.ts`, `onboarding.ts` | All typed; `database.ts` generated from Supabase schema |
| **Config** | `ai.ts`, `crm.ts`, `dashboard.ts`, `homepage.ts`, `knowledge.ts` | Static constants only |

### Key Architectural Invariants

1. **Services never call `supabase.from()` directly** — all DB access through typed repositories
2. **Components never call services directly** — API routes are the boundary
3. **Admin client (`service-role`)** used only for workspace provisioning; all other queries use the user session client with RLS active
4. **Edge proxy** (`proxy.ts`) enforces auth at the CDN layer for all `/dashboard/*` routes
5. **`getUser()` not `getSession()`** — token is revalidated server-side on every auth check

---

## 2. Test Coverage

### Summary

| Metric | Value |
|---|---|
| Test files | 12 |
| Total tests | 98 |
| Pass rate | 100% |
| Framework | Vitest 4.1.9 |

### Coverage by Module

| Module | Tests | Notes |
|---|---|---|
| `lib/dates.ts` | 18 | All edge cases: null, negative, boundary values |
| `services/people/people-engine.ts` | 25 | Relationship strength, engagement, influence, decision-maker, champion |
| `services/intelligence/signal-engine.ts` | 15 | Deal/task/project signal emission, severity levels |
| `services/crm/` (runtime) | 8 | Workspace resolution, filter normalization |
| `repositories/crm/companies.ts` | 2 | List scoping, soft delete |
| `repositories/crm/deals.ts` | 1 | Multi-filter query composition |
| `services/ai/provider-registry.ts` | 5 | Register, retrieve, list, default selection |
| `services/ai/openai-provider.ts` | 5 | Status, capabilities, key-absent error |
| `services/ai/prompt-builder.ts` | 7 | Identity, metrics, risks, user name, instructions |
| `lib/supabase/auth-errors.ts` | 3 | Error message mapping |
| `types/onboarding.ts` (ONBOARDING_STEPS) | 3 | Step count, order, content |
| `services/onboarding/provisioning-service.ts` (deriveOrgSlug) | 4 | Slug format, edge cases |

### Coverage Gaps

- No tests for API routes (integration tests missing — see TD-007)
- No tests for Google OAuth flow, Gmail sync, Calendar API
- No tests for Knowledge Engine document pipeline
- No tests for Memory Engine or Learning Engine
- No tests for Executive Summary Service

---

## 3. Performance

### Bundle Characteristics

- **32 routes** in total (mix of static and dynamic)
- Lazy-loaded: `PromptPreviewPanel` (loaded only when AI assistant panel expands)
- Memoized: `AIConversationSidebar` (`React.memo`)
- Server components: all non-interactive dashboard widgets
- Client components: `AppShell` (mobile drawer state), `AIChatWindow`, `AIConversationSidebar`, `AIComposer`

### Known Performance Issues

| # | Issue | Severity | Resolution |
|---|---|---|---|
| P1 | 8 static components have unnecessary `"use client"` | Medium | Address in v1.3 — bundle size reduction |
| P3 | `AIMessage` not memoized; re-renders entire history on each new message | Medium | Address in v1.3 |
| P5 | `AppShell` is client-only for one mobile `useState` | Low | Address when mobile layout is finalized |

---

## 4. Security

### Posture

| Area | Status | Notes |
|---|---|---|
| Edge auth guard | ✅ Implemented | `proxy.ts` protects all `/dashboard/*` at CDN layer |
| API route auth | ✅ Implemented | All routes call `supabase.auth.getUser()` |
| Database RLS | ✅ Implemented | All tables have `is_org_member()` / `is_workspace_member()` policies |
| Workspace isolation (read) | ✅ Implemented | All list/search queries filter by `workspace_id` |
| Workspace isolation (write) | ✅ Fixed in v1.2.1 | Added explicit ownership assertions to 6 CRM mutation methods |
| Google token encryption | ✅ Implemented | AES-256-GCM at rest |
| OAuth CSRF protection | ✅ Implemented | `timingSafeEqual` nonce validation |
| Input sanitization | ✅ Implemented (knowledge) | PostgREST metacharacter sanitization in knowledge search |
| ilike wildcard DoS | ⚠️ Partial | CRM search does not escape `%`/`_` — see TD |
| Security headers | ❌ Missing | No CSP, X-Frame-Options, etc. — see TD |
| Rate limiting | ❌ Missing | No rate limiting on AI messages endpoint — see TD |
| API route auth coverage | ⚠️ Advisory | Middleware covers only `/dashboard/*`; each `/api/*` route self-checks |

### Findings Fixed in v1.2.1

- [HIGH] CRM service mutation methods (`updateCompany`, `deleteCompany`, `updateContact`, `deleteContact`, `updateDeal`, `deleteDeal`) lacked explicit workspace ownership assertion — **fixed**: added `resolveWorkspace(userId, existing.workspace_id)` check before each mutation
- [HIGH] Dead Next.js middleware (`proxy.ts` → `middleware.ts`) — **fixed**: correct `proxy.ts` with `proxy` export per Next.js 16 convention

### Remaining Findings (tracked in `docs/technical-debt.md`)

- [MEDIUM] ilike wildcard injection in CRM search (performance DoS, not data access risk)
- [MEDIUM] No security headers (`Content-Security-Policy`, `X-Frame-Options`)
- [MEDIUM] No rate limiting on AI message endpoint
- [LOW] `listByIds` in contacts/companies lacks workspace filter (defense-in-depth gap; RLS covers primary protection)

---

## 5. Code Quality

### Improvements in v1.2.1

| # | Issue | Action |
|---|---|---|
| Q1 | `formatCurrency` duplicated in 4 files | Replaced with `formatCompactCurrency` from `utils/formatters.ts` |
| Q2 | `relativeTime` duplicated in 3 files | Replaced with `formatRelativeTime` from `utils/formatters.ts` |
| Q4 | `types/entities.ts` + `types/index.ts` entirely unused | Deleted |
| Q7 | `FutureOpenAIProvider` dead export (superseded by real `OpenAIProvider`) | Deleted |

### Remaining Issues (tracked in `docs/technical-debt.md`)

| # | Issue | Priority |
|---|---|---|
| Q3 | `MS_PER_DAY` not exported; `1000*60*60*24` inline in 5 files | Medium |
| Q5 | `DashboardShellStatus` exported but unused | Low |
| Q9 | 5 files exceed 500 LOC (notably `crm-service.ts` at 1,200+ lines) | Medium |
| Q10 | Magic scoring constants in intelligence services | Low |
| Q11 | `AuthProvider` over-broad client boundary in dashboard layout | Low |

---

## 6. CI/CD

### Current Pipeline (`.github/workflows/ci.yml`)

```
Checkout → Node.js 22 setup → npm ci → Lint → Type-check & Build → Test
```

✅ All three quality gates now run on every push and PR.

### Remaining Gaps

- Migrations are not applied to a test DB in CI (see TD-015)
- No staging environment or preview deployments configured
- No dependency audit (`npm audit`) step
- No bundle size tracking or performance regression detection

---

## 7. Shared Utilities — Consolidation Status

| Utility | Before v1.2.1 | After v1.2.1 |
|---|---|---|
| `daysSince` | Duplicated in 4 service files | Consolidated in `lib/dates.ts` ✅ |
| `clamp` | Duplicated in 3 service files | Consolidated in `lib/dates.ts` ✅ |
| `formatCurrency` (compact) | Duplicated in 4 files | Consolidated in `utils/formatters.ts` ✅ |
| `relativeTime` | Duplicated in 3 component files | Consolidated in `utils/formatters.ts` ✅ |
| `MS_PER_DAY` (86_400_000) | Private to `lib/dates.ts`; 5 inline duplicates remain | Address in v1.3 |

---

## 8. Known Limitations

1. **Semantic and hybrid search are mocked** — knowledge search returns placeholder results for these modes
2. **Google token refresh is not automated** — Gmail/Calendar sync will fail silently after 1-hour token expiry
3. **Gmail sync has no incremental cursor** — each restart triggers a full re-sync
4. **No background jobs** — all operations (knowledge pipeline, Gmail sync) are synchronous in the API handler
5. **No rate limiting** — AI message and Gmail sync endpoints are uncapped

---

## 9. Release Checklist

Before tagging v1.2.1:

- [x] `npm run lint` — clean
- [x] `npm run build` — 32 routes, no errors
- [x] `npm test` — 98/98 tests passing
- [x] Security: CRM workspace isolation fixed
- [x] Security: Edge proxy correct for Next.js 16
- [x] Docs: CHANGELOG updated (v1.2.0 + v1.2.1 entries)
- [x] Docs: README developer setup guide
- [x] Docs: `docs/technical-debt.md` created
- [x] Docs: `docs/release-audit-v1.2.1.md` (this file)
- [x] Docs: `.env.example` with all required variables
- [x] CI: Test step added to `.github/workflows/ci.yml`

---

## 10. Handoff Notes for v1.3

v1.3 begins at the commit after this release. Key starting points:

1. **TD-001 has been fixed** (CI now runs tests); verify CI passes on first v1.3 commit
2. **Semantic search** (`services/knowledge/search-service.ts`) is the primary v1.3 P0 deliverable — add pgvector and wire `semanticSearch`
3. **Google token refresh** (TD-003) is the reliability blocker for v1.2 Gmail/Calendar — fix early in v1.3
4. The `AIMessage` memoization gap (P3) will become noticeable in longer conversations — address before v1.3 demo

See [Release Board](roadmap/RELEASE_BOARD.md) for the full v1.3 feature plan.
