# Changelog

All notable changes to MyBoss360 are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versions follow semantic versioning (`MAJOR.MINOR.PATCH`).

---

## [v1.2.1] — 2026-07-01

**Theme: Architecture Freeze & Engineering Excellence**

Stabilizes the platform before v1.3. No new product features — focus on testing foundation, security hardening, shared utilities, and documentation completeness.

### Added

- **Vitest test suite** (`vitest.config.ts`) — replaced non-functional `node:test` setup; native TypeScript + `@/` alias support; 98 tests across 12 test files.
- **Date utilities** (`lib/dates.ts`) — single source of truth for `daysSince`, `daysUntil`, `daysSinceDate`, `clamp`; eliminates duplicated implementations across 4 services.
- **Edge middleware** (`middleware.ts`) — proper Next.js middleware enforcing Supabase auth at the CDN edge for all `/dashboard/*` routes. Replaces dead `proxy.ts` (wrong export name, never loaded by Next.js).
- **`.env.example`** — documents all 9 required environment variables with descriptions and generation hints.
- **Developer README** — full setup guide, project structure, commands reference, architecture summary.
- **Tests: date utilities** (`tests/lib/dates.test.ts`) — 18 tests covering all edge cases.
- **Tests: people engine** (`tests/services/people/people-engine.test.ts`) — 25 tests for scoring functions.
- **Tests: signal engine** (`tests/services/intelligence/signal-engine.test.ts`) — 15 tests covering deal/task/project signals.
- **Tests: prompt builder, onboarding, provisioning, CRM** — all converted from `node:test` to vitest; fixtures updated for current `IntelligenceContext` shape.

### Fixed

- **Dead middleware** (`proxy.ts`) — deleted; replaced by `middleware.ts` with the correct export name recognized by Next.js.
- **Duplicated utilities** — `daysSince` removed from `signal-engine`, `pattern-detector`, `people-engine`; `clamp` removed from `people-engine`, `gmail-relationship-intelligence`, `executive-summary-service`.
- **`intelligence-service.ts` confused code path** — `listPatterns().then(() => fresh DB query)` pattern discarded the patterns result; replaced with direct `learning_signals` query.
- **`IntelligenceContext` fixture** — prompt-builder tests were missing `learningSignals`, `emailIntelligence`, `peopleIntelligence` fields added in v1.2.0.
- **People engine scoring functions** — `computeRelationshipStrength`, `computeEngagementScore`, `computeInfluenceScore`, `isDecisionMaker`, `isChampion` now exported for testability.

### Security

- **Edge auth guard** — dashboard routes now protected at the middleware layer (before server components run), not only at the page level.

---

## [v1.2.0] — 2026-07-01

**Theme: Connected Executive — Google Workspace & People Intelligence**

First external data integration milestone. Gmail and Google Calendar are live; the People Intelligence Engine adds relationship scoring, engagement tracking, and influence mapping across CRM and email data.

### Added

- **Google OAuth service** (`services/google/google-oauth-service.ts`) — per-workspace credential store with AES-256-GCM encryption; timing-safe CSRF nonce validation in OAuth callback.
- **Google OAuth API** (`app/api/google/`) — connect/callback/status/disconnect endpoints.
- **Gmail sync service** (`services/google/gmail-sync-service.ts`) — thread ingestion, incremental sync, retry logic.
- **Gmail API client** (`services/google/gmail-api-client.ts`) — typed Gmail REST wrapper.
- **Gmail thread intelligence** (`services/google/gmail-thread-intelligence.ts`) — thread summarization, action item extraction, priority classification.
- **Gmail relationship intelligence** (`services/google/gmail-relationship-intelligence.ts`) — extracts relationship signals from email patterns.
- **Gmail contact extractor** (`services/google/gmail-contact-extractor.ts`) — builds contact profiles from email metadata.
- **Gmail knowledge ingestion** (`services/google/gmail-knowledge-ingestion.ts`) — bridges email content into the Knowledge Engine pipeline.
- **Gmail API** (`app/api/gmail/`) — sync, status, and thread endpoints.
- **Google Calendar API client** (`services/google/google-calendar-api.ts`) — typed Calendar REST wrapper.
- **Calendar API** (`app/api/calendar/`) — events and sync endpoints.
- **People Engine** (`services/people/people-engine.ts`) — relationship strength scoring, engagement scoring, influence scoring; `isDecisionMaker` / `isChampion` classifiers.
- **People Service** (`services/people/people-service.ts`) — top relationships, stale relationships, champions, decision makers, awaiting-reply and needs-follow-up buckets.
- **People API** (`app/api/people/`) — relationship intelligence endpoints.
- **Intelligence Service** (`services/intelligence/intelligence-service.ts`) — unified context assembly: metrics + risks + opportunities + signals + patterns + email + people.
- **Signal Engine** (`services/intelligence/signal-engine.ts`) — deal/task/project signal emission with severity classification.
- **Pattern Detector** (`services/intelligence/pattern-detector.ts`) — stale deal detection, engagement drop detection, new relationship detection.
- **Recommendation Engine** (`services/intelligence/recommendation-engine.ts`) — action recommendations from signals and patterns.
- **Executive Summary Service** (`services/dashboard/executive-summary-service.ts`) — aggregates all intelligence into a briefing-ready summary.
- **People Intelligence docs** (`docs/people-intelligence.md`) — architecture, scoring model, data sources.
- **Executive AI polish** (`components/ai/`) — time-aware greeting, typing indicator, streaming states, `memo()` on conversation sidebar, lazy-loaded prompt preview panel, ARIA roles.
- **Product polish docs** (`docs/product-polish.md`) — Sprint 20.8 implementation record.

### Fixed

- **`AIStatusBadge` provider name** — default changed from "Mock Provider" to "Executive AI".
- **Dashboard empty state** — message updated from internal developer language to user-facing copy.

---

## [v1.1.0] — 2026-07-01

**Theme: Knowledge Engine — RAG Foundation**

The Knowledge Engine establishes the permanent knowledge layer of the platform. Every document an executive creates or ingests is parsed, chunked, and stored in a structured schema purpose-built for Retrieval-Augmented Generation. Search is live (keyword via trigram index); semantic and hybrid search interfaces are in place and will be wired to pgvector in v1.3.

### Added

- **Knowledge schema** (`supabase/migrations/20260701000001_knowledge_schema.sql`) — 9 tables: `knowledge_collections`, `knowledge_sources`, `knowledge_documents`, `knowledge_chunks`, `knowledge_tags`, `document_tags`, `knowledge_links`, `document_versions`, `document_permissions`. Full RLS on all tables via `is_workspace_member()`.
- **Document pipeline** (`services/knowledge/document-pipeline.ts`) — parse → normalize → chunk with four strategies: paragraph, sentence, fixed-size (with overlap), and semantic (falls back to paragraph until NLP model is wired in v1.3).
- **Knowledge service** (`services/knowledge/knowledge-service.ts`) — full CRUD over documents, collections, and tags. `createDocument` runs the pipeline automatically. `updateDocument` saves an immutable version snapshot before applying changes and re-chunks if content changed.
- **Search service** (`services/knowledge/search-service.ts`) — `keywordSearch` (live, trigram-accelerated `ilike`), `semanticSearch` (mock, reserved), `hybridSearch` (mock, reserved). Unified `search(query, mode)` entry point. User input sanitized against PostgREST filter metacharacters before interpolation.
- **Repository layer** (`repositories/knowledge/`) — `documents`, `chunks`, `collections`, `tags` repositories with full barrel export.
- **Knowledge API** (`app/api/knowledge/route.ts`) — GET (list / search / collections / tags), POST (create document / collection / tag), PATCH (update document), DELETE (soft-delete). All routes: Supabase SSR auth, workspace resolution, try/catch JSON 500.
- **Domain types** (`types/knowledge.ts`) — 30+ TypeScript types covering all entities, pipeline I/O, search contracts, and CRUD inputs.
- **Database types** (`types/database.ts`) — Row/Insert/Update types for all 9 knowledge tables.
- **Config** (`config/knowledge.ts`) — 15 object types, 9 categories, human-readable labels, pipeline constants.
- **Enterprise architecture docs** (`docs/architecture/`) — 4 documents: README, system-architecture, database-erd (27 tables), ai-architecture.
- **Knowledge Engine doc** (`docs/knowledge-engine.md`) — architecture overview, schema reference, pipeline guide, API reference, Sprint 20–24 roadmap.

### Fixed

- **PostgREST filter injection** (MEDIUM) — sanitize user query before interpolating into `.or()` filter string; strips `,().:*` metacharacters that could break out of the value position.

---

## [v1.0.0] — 2026-06-15

**Theme: Executive Onboarding & Workspace Provisioning**

Every new user now flows through an 8-step onboarding wizard. Completing the wizard automatically provisions a full workspace: organization, workspace record, default role, and dual membership (org-level + workspace-level). The dashboard is gated behind onboarding — unauthenticated or unprovisioned users are redirected immediately.

### Added

- **Onboarding schema** — `onboarding_state` table with step tracking and completion timestamp.
- **Onboarding config** — 8-step state machine: `welcome → company_name → industry → company_size → country → currency → business_goals → finish`.
- **Onboarding repository** (`repositories/onboarding/`) — `findByUser`, `upsert`, `markComplete`.
- **Onboarding service** (`services/onboarding/onboarding-service.ts`) — `getStatus`, `advanceStep`, `completeOnboarding`.
- **Provisioning service** (`services/onboarding/provisioning-service.ts`) — atomic workspace provisioning with cleanup-on-failure: creates organization, workspace, default role, org-level membership, workspace-level membership. Rollback deletes the organization record if any step fails.
- **Admin client** (`lib/supabase/admin.ts`) — service-role client for provisioning (bypasses RLS). Server-side only.
- **Onboarding API** (`app/api/onboarding/route.ts`) — GET (status), POST (start/provision), PATCH (advance step with whitelist guard), all wrapped in try/catch.
- **Onboarding wizard UI** (`components/onboarding/OnboardingWizard.tsx`) — 8-step premium layout with animated step transitions, progress indicator, and form validation.
- **Onboarding page** (`app/(onboarding)/onboarding/page.tsx`) — server component: auto-provisions workspace on first visit, redirects to `/dashboard` if already complete.
- **Dashboard gate** — `app/(dashboard)/layout.tsx` checks onboarding completion via service-role client; redirects incomplete users to `/onboarding`.
- **Onboarding docs** (`docs/onboarding.md`) — flow diagrams, provisioning detail, troubleshooting.

### Fixed

- **Invalid step guard** — PATCH handler now validates step against the `ONBOARDING_STEPS` whitelist; returns HTTP 400 for unknown steps (previously silently reset wizard to `welcome`).
- **Unhandled rejections** — all three API handlers (GET, POST, PATCH) wrapped in try/catch returning structured JSON 500.
- **503 instead of 404** for missing workspace in AI messages API (`app/api/ai/messages/route.ts`) — structured error with `code: 'no_workspace'`.
- **Error display in chat** — `AIChatWindow.tsx` renders the workspace error in the empty-state UI so users understand what to do.

---

## [v0.6.0] — 2026-04-30

**Theme: AI Infrastructure & OpenAI Integration**

Introduced the full executive AI runtime: a streaming chat layer backed by OpenAI GPT-4o with a pluggable provider interface designed to support Anthropic and multi-provider routing in future versions.

### Added

- **Executive AI runtime** (`src/ai/`) — provider abstraction, streaming response pipeline, system prompt construction.
- **OpenAI provider** — GPT-4o integration via `openai` SDK; streaming via Server-Sent Events.
- **AI conversations API** — `app/api/ai/conversations/` and `app/api/ai/messages/` — conversation management and message dispatch.
- **AI Chat UI** (`components/ai/AIChatWindow.tsx`) — streaming message rendering, conversation history, empty state.
- **Intelligence context API** (`app/api/intelligence/context/`) — surface workspace metrics as AI context.
- **Executive runtime docs** (`docs/executive-runtime.md`, `docs/intelligence-architecture.md`, `docs/ai-architecture.md`).

---

## [v0.5.0] — 2026-03-31

**Theme: Production Quality & Executive Intelligence**

Hardened the entire platform for production: metrics engine, memory and learning subsystems, coverage gating, and code quality tooling.

### Added

- **Executive metrics engine** — real-time KPI aggregation over CRM and workspace data.
- **Memory engine** — per-user preference and interaction memory with TTL.
- **Learning engine** — behavioral signal capture for future personalization.
- **Production hardening** — error boundaries, loading states, edge-case handling across all routes.
- **Test coverage gating** — Vitest with V8 coverage thresholds (70% lines/branches/functions/statements).
- **Environments documentation** (`docs/environments.md`).

---

## [v0.4.0] — 2026-02-28

**Theme: CRM Production**

Replaced mock CRM data with a real service and repository layer backed by Supabase.

### Added

- **CRM service** (`services/crm/`) — companies, contacts, deals, activities backed by live Supabase queries.
- **Repository layer** (`repositories/crm/`) — typed repositories for all CRM entities.
- **Database seed** (`supabase/seed.sql`) — full demo dataset: 1 org, 1 workspace, 10 companies, 12 contacts, 8 deals, 10 activities, 4 projects, 10 tasks, 5 calendar events.
- **Repository refinements** — `WorkspacesRepository.listForUser()` via memberships inner join; `ProfilesRepository.listByIds()` naming convention.

---

## [v0.3.0] — 2026-02-01

**Theme: Auth & Database Foundation**

Introduced real Supabase authentication (SSR cookie-based, httpOnly) and a 21-table multi-tenant schema with Row-Level Security on every table.

### Added

- **Supabase SSR auth** (`@supabase/ssr`) — browser + server clients, httpOnly cookies, middleware-based session refresh.
- **Auth middleware** — `/dashboard` protected; unauthenticated requests redirect to `/login`.
- **Multi-tenant schema** — 21 tables: organizations, workspaces, memberships, roles, profiles, CRM entities (companies, contacts, deals, activities, projects, tasks, calendar events), AI tables. Full RLS via `is_org_member()` / `is_workspace_member()` helper functions.
- **AuthProvider + useAuth hook** — client-side auth context.
- **Login / Register pages** — Supabase signIn/signUp with client-side validation.
- **Dashboard auth gate** — server-side `getUser()` in layout; dynamic routes for all dashboard pages.

### Fixed

- **Cookie security** — migrated from manual cookie writing (`httpOnly: false`) to `@supabase/ssr` which sets `httpOnly: true` by default.

---

## [v0.2.0] — 2026-01-20

**Theme: Dashboard & CRM Shell**

Built the premium executive dashboard and CRM workspace UI. All data mocked at this stage; real services wired in v0.4.

### Added

- **Dashboard shell** (`app/(dashboard)/`) — executive layout with sidebar navigation, topbar, and responsive grid.
- **Dashboard home** — KPI cards, recent activity feed, quick-action panels.
- **CRM workspace** — companies, contacts, deals pipeline, activities views with premium table layouts.
- **UI component library** — extended shadcn/ui with custom card components, data tables, status badges, priority indicators.
- **Dashboard config system** — `config/dashboard.ts`, `config/crm.ts` — typed mock data and layout configuration.
- **Premium visual polish** — hover states, color-coded indicators, ANSI-safe table wrapping, single-row topbar.

---

## [v0.1.0] — 2026-01-07

**Theme: Scaffold & Homepage**

Initial project scaffold and marketing homepage.

### Added

- **Next.js 16 App Router scaffold** — TypeScript, Tailwind CSS v4, shadcn/ui, ESLint, Vitest.
- **Marketing homepage** (`app/(marketing)/`) — hero section, feature highlights, CTA.
- **Route groups** — `(auth)`, `(dashboard)`, `(onboarding)`, `(marketing)` architecture.
- **Project context** (`AGENTS.md`, `CLAUDE.md`) — agent collaboration guidelines.
- **Initial commit baseline** — monorepo structure, CI-ready configuration.
