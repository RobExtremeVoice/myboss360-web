# Technical Debt Report

> Generated: 2026-07-01 | Release: v1.2.1 | Sprint: 20.9 Architecture Freeze

This document catalogs known limitations, architectural risks, and future refactors. Priority uses MoSCoW notation; complexity is T-shirt sized (S/M/L/XL).

---

## Critical (Must address before v1.3)

### TD-001 — CI pipeline missing test step
**File:** `.github/workflows/ci.yml`
**Description:** The CI pipeline runs `lint` and `build` but does not run `npm test`. A broken test suite merges silently.
**Risk:** Test regressions go undetected in CI.
**Fix:** Add `- run: npm test` step after build.
**Priority:** Must | **Complexity:** S

### TD-002 — No semantic search (mock in production path)
**Files:** `services/knowledge/search-service.ts`
**Description:** `semanticSearch` and `hybridSearch` return mock results. Both are invokeable via the knowledge API, meaning callers receive fake data without warning.
**Risk:** Misleads integrators; silent degradation if caller expects real results.
**Fix:** Gate behind feature flag or return explicit `{ mode: 'mock', results: [] }` until pgvector is wired in v1.3.
**Priority:** Must | **Complexity:** S

---

## High (Address in v1.3)

### TD-003 — Google token refresh not automated
**Files:** `services/google/google-oauth-service.ts`
**Description:** Access tokens are stored and decrypted on use, but automatic refresh on 401 is not implemented. Tokens expire after 1 hour; sync jobs fail silently until user reconnects.
**Risk:** Silent Gmail/Calendar sync failures after token expiry.
**Fix:** Add refresh-on-401 interceptor in `gmail-api-client.ts` and `google-calendar-api.ts`.
**Priority:** High | **Complexity:** M

### TD-004 — Gmail sync has no incremental cursor persistence
**Files:** `services/google/gmail-sync-service.ts`
**Description:** Sync uses Gmail's `historyId` concept but the cursor is not persisted across restarts. Each restart triggers a full re-sync of recent threads.
**Risk:** Duplicate signals and wasted API quota.
**Fix:** Persist `historyId` per workspace in a `sync_state` table.
**Priority:** High | **Complexity:** M

### TD-005 — No rate limiting on AI message API
**Files:** `app/api/ai/messages/route.ts`
**Description:** The messages endpoint makes uncapped OpenAI calls. A single user can exhaust API quota with rapid requests.
**Risk:** Cost overrun; platform outage for all users if quota is hit.
**Fix:** Add per-workspace rate limiter (e.g., Upstash Redis + sliding window).
**Priority:** High | **Complexity:** M

### TD-006 — `recentSignals` field in `IntelligenceContext` is redundant
**Files:** `services/intelligence/intelligence-service.ts`, `types/intelligence.ts`
**Description:** Both `recentSignals` (raw `learning_signals` rows) and `learningSignals` exist on `IntelligenceContext`. They overlap in content.
**Risk:** Confusion about which field to use; prompt builder may include duplicate data.
**Fix:** Consolidate to `learningSignals` only; remove `recentSignals` and update callers.
**Priority:** High | **Complexity:** S

---

## Medium (Address in v1.4 or as opportunity arises)

### TD-007 — No integration tests for API routes
**Files:** `app/api/`
**Description:** All tests are unit tests. API routes (especially the auth + workspace resolution flow) have no integration coverage.
**Risk:** Regressions in auth/workspace logic go undetected.
**Fix:** Add Vitest integration tests using `next/server` test utilities or a test HTTP client.
**Priority:** Medium | **Complexity:** L

### TD-008 — Knowledge pipeline runs synchronously in API handler
**Files:** `app/api/knowledge/route.ts`, `services/knowledge/knowledge-service.ts`
**Description:** `createDocument` runs the full parse→chunk pipeline inline in the POST handler. Large documents block the response for several seconds.
**Risk:** Timeout errors for large documents; poor UX.
**Fix:** Move pipeline to a background job (Supabase Edge Function or a queue).
**Priority:** Medium | **Complexity:** L

### TD-009 — `config/crm.ts` and `config/dashboard.ts` contain mock data arrays
**Files:** `config/crm.ts`, `config/dashboard.ts`
**Description:** These files were created in v0.2 when data was mocked. Some arrays are no longer used now that real services exist but the files remain.
**Risk:** Confusion about what's real vs mock; unused code inflates bundle.
**Fix:** Audit and remove unused mock arrays; keep only typed config constants.
**Priority:** Medium | **Complexity:** S

### TD-010 — TypeScript `any` usage in repository layer
**Files:** `repositories/crm/deals.ts` (listFiltered options typing)
**Description:** Some repository filter parameters fall back to `unknown` or implicit `any` in edge cases.
**Risk:** Runtime type errors that TypeScript doesn't catch.
**Fix:** Add explicit generic constraint types to filter parameter interfaces.
**Priority:** Medium | **Complexity:** S

### TD-011 — No structured error codes in API responses
**Files:** `app/api/`
**Description:** Most API routes return `{ error: 'message string' }` without a machine-readable error code. The `no_workspace` code in the AI messages route is the only exception.
**Risk:** Clients cannot programmatically differentiate error types.
**Fix:** Standardize on `{ error: { code: string, message: string } }` across all routes.
**Priority:** Medium | **Complexity:** M

---

## Low (Future roadmap)

### TD-012 — No client-side request deduplication for intelligence context
**Files:** `app/(dashboard)/dashboard/`
**Description:** Multiple dashboard widgets may independently fetch intelligence context on mount with no shared cache or deduplication.
**Risk:** Redundant API calls; inflated Supabase read counts.
**Fix:** Add React Query or SWR for shared data fetching with stale-while-revalidate.
**Priority:** Low | **Complexity:** L

### TD-013 — Accessibility: no focus trap in modal dialogs
**Files:** `components/`
**Description:** Some modal/dialog components do not trap focus, violating WCAG 2.1 SC 2.1.2.
**Risk:** Keyboard navigation breaks for screen reader users.
**Fix:** Ensure all dialogs use Radix `Dialog.Root` which provides native focus management.
**Priority:** Low | **Complexity:** S

### TD-014 — No OpenTelemetry / structured logging
**Files:** across `services/`, `app/api/`
**Description:** Errors are logged with `console.error`. No trace IDs, no structured log format, no APM integration.
**Risk:** Hard to debug production issues; no visibility into performance.
**Fix:** Add `pino` or `winston` with structured JSON output; instrument AI calls for latency tracking.
**Priority:** Low | **Complexity:** L

### TD-015 — Database migrations not automated in CI
**Files:** `.github/workflows/ci.yml`
**Description:** CI does not apply migrations to a test database. Schema changes may be undetectable until deployed.
**Risk:** Migration failures surface only in production.
**Fix:** Add a Supabase CLI step in CI that spins up a local Supabase instance and runs migrations.
**Priority:** Low | **Complexity:** XL

---

## Resolved in v1.2.1

| ID | Issue | Resolution |
|---|---|---|
| — | Dead Next.js middleware (`proxy.ts`) | Deleted; replaced with `middleware.ts` with correct export |
| — | Duplicated `daysSince`/`clamp` utilities across 4 services | Consolidated into `lib/dates.ts` |
| — | `intelligence-service.ts` confused `listPatterns().then()` pattern | Replaced with direct DB query |
| — | `node:test` files not recognized by vitest | Converted all 12 test files to vitest API |
| — | Missing `IntelligenceContext` fields in test fixtures | Updated `prompt-builder.test.ts` fixture |
| — | No `.env.example` | Created with all 9 required vars documented |
