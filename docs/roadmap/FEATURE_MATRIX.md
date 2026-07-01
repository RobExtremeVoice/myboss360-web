# Feature Matrix

> Last updated: 2026-07-01

Legend — Status: ✅ Shipped · 🔄 In Progress · 🗓 Planned · 🔬 Research  
Legend — Priority: P0 (must-have) · P1 (important) · P2 (nice-to-have)

---

## Platform Foundation

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Next.js 16 App Router scaffold | ✅ Shipped | v0.1 | P0 | — |
| TypeScript strict mode | ✅ Shipped | v0.1 | P0 | — |
| Tailwind CSS v4 + shadcn/ui | ✅ Shipped | v0.1 | P0 | — |
| Route groups (auth / dashboard / onboarding / marketing) | ✅ Shipped | v0.1 | P0 | — |
| Vitest test suite with V8 coverage thresholds | ✅ Shipped | v0.5 | P0 | — |
| ESLint + code quality pipeline | ✅ Shipped | v0.1 | P0 | — |
| Marketing homepage | ✅ Shipped | v0.1 | P1 | — |

---

## Authentication & Identity

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Supabase SSR authentication (`@supabase/ssr`) | ✅ Shipped | v0.3 | P0 | Supabase project |
| httpOnly cookie security | ✅ Shipped | v0.3 | P0 | `@supabase/ssr` |
| Next.js middleware auth guard | ✅ Shipped | v0.3 | P0 | Supabase SSR |
| Login page (email + password) | ✅ Shipped | v0.3 | P0 | Supabase auth |
| Register page with client-side validation | ✅ Shipped | v0.3 | P0 | Supabase auth |
| AuthProvider + useAuth hook | ✅ Shipped | v0.3 | P0 | Supabase SSR |
| Multi-Factor Authentication (TOTP) | 🗓 Planned | v1.x | P1 | Auth hardening |
| Single Sign-On (SAML / OIDC) | 🗓 Planned | v1.x (enterprise) | P1 | Identity provider |
| Social OAuth (Google) | 🗓 Planned | v1.2 | P1 | Google OAuth |

---

## Multi-Tenant Architecture

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Organizations table + RLS | ✅ Shipped | v0.3 | P0 | Supabase |
| Workspaces table + RLS | ✅ Shipped | v0.3 | P0 | Organizations |
| Memberships (org-level + workspace-level dual membership) | ✅ Shipped | v0.3 | P0 | Orgs + workspaces |
| Roles + role-based memberships | ✅ Shipped | v0.3 | P0 | Memberships |
| Service-role admin client (provisioning bypass) | ✅ Shipped | v1.0 | P0 | `SUPABASE_SERVICE_ROLE_KEY` |
| Workspace auto-provisioning on first login | ✅ Shipped | v1.0 | P0 | Admin client |
| Provisioning rollback (cleanup on failure) | ✅ Shipped | v1.0 | P0 | Admin client |
| Workspace switching (multi-workspace user) | 🗓 Planned | v1.2 | P1 | Workspace resolver |

---

## Executive Onboarding

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| 8-step onboarding wizard UI | ✅ Shipped | v1.0 | P0 | shadcn/ui |
| Onboarding state machine (server-side) | ✅ Shipped | v1.0 | P0 | Supabase |
| Step whitelist validation (PATCH guard) | ✅ Shipped | v1.0 | P0 | Onboarding API |
| Dashboard gate (redirect if onboarding incomplete) | ✅ Shipped | v1.0 | P0 | Admin client |
| Onboarding analytics (funnel tracking) | 🗓 Planned | v1.2 | P2 | Analytics layer |

---

## Dashboard & UI

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Executive dashboard shell | ✅ Shipped | v0.2 | P0 | Next.js layout |
| KPI cards with real-time data | ✅ Shipped | v0.5 | P0 | Metrics engine |
| Sidebar navigation | ✅ Shipped | v0.2 | P0 | — |
| Single-row topbar (h-16) with search | ✅ Shipped | v0.7 | P1 | — |
| Premium hover states + color-coded indicators | ✅ Shipped | v0.7 | P1 | — |
| Executive Agenda view | 🗓 Planned | v1.2 | P0 | Google Calendar integration |
| Notification centre | 🗓 Planned | v1.4 | P1 | Automation engine |
| Mobile-responsive layout | 🗓 Planned | v1.3 | P1 | Design system update |

---

## CRM

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Companies view (table + filters) | ✅ Shipped | v0.2 | P0 | — |
| Contacts view (table + filters) | ✅ Shipped | v0.2 | P0 | — |
| Deals pipeline view | ✅ Shipped | v0.2 | P0 | — |
| Activities feed | ✅ Shipped | v0.2 | P0 | — |
| Real CRM service (Supabase-backed) | ✅ Shipped | v0.4 | P0 | Repository layer |
| Contact enrichment via Google Contacts | 🗓 Planned | v1.2 | P1 | Google Contacts API |
| Email thread view per contact | 🗓 Planned | v1.2 | P1 | Google Gmail API |
| CRM AI assistant (context-aware) | 🗓 Planned | v1.3 | P1 | Knowledge Engine + RAG |
| Sales Agent (autonomous pipeline management) | 🗓 Planned | v2.0 | P0 | Multi-agent runtime |

---

## Knowledge Engine

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| 9-table knowledge schema (RLS) | ✅ Shipped | v1.1 | P0 | Supabase |
| Document pipeline (parse + chunk, 4 strategies) | ✅ Shipped | v1.1 | P0 | — |
| Keyword search (trigram GIN index) | ✅ Shipped | v1.1 | P0 | pg_trgm |
| Semantic search interface (mock) | ✅ Shipped | v1.1 | P0 | pgvector (v1.3) |
| Hybrid search interface (mock) | ✅ Shipped | v1.1 | P0 | pgvector + embeddings (v1.3) |
| Document versioning (immutable snapshots) | ✅ Shipped | v1.1 | P0 | — |
| Per-document ACL | ✅ Shipped | v1.1 | P1 | RBAC |
| Collections and tags | ✅ Shipped | v1.1 | P1 | — |
| OpenAI Embeddings (`text-embedding-3-small`) | 🗓 Planned | v1.3 | P0 | OpenAI API key |
| pgvector — vector column on chunks | 🗓 Planned | v1.3 | P0 | pgvector extension |
| Semantic search (live) | 🗓 Planned | v1.3 | P0 | Embeddings + pgvector |
| Hybrid search with RRF scoring (live) | 🗓 Planned | v1.3 | P1 | Semantic search |
| Incremental re-embedding | 🗓 Planned | v1.3 | P1 | Embeddings |
| Document Intelligence (auto-tagging, entity extraction) | 🗓 Planned | v1.3 | P2 | NLP pipeline |
| Knowledge UI (browser + editor + search) | 🗓 Planned | v1.3 | P1 | Knowledge Engine |
| Google Drive ingestion | 🗓 Planned | v1.2 | P1 | Google Drive API + pipeline |

---

## AI Assistant

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Executive AI runtime (provider abstraction) | ✅ Shipped | v0.6 | P0 | — |
| OpenAI GPT-4o integration | ✅ Shipped | v0.6 | P0 | OpenAI API key |
| Streaming chat (SSE) | ✅ Shipped | v0.6 | P0 | OpenAI streaming |
| AI conversation history (per-workspace) | ✅ Shipped | v0.6 | P0 | Supabase |
| AI Chat UI (streaming messages) | ✅ Shipped | v0.6 | P0 | — |
| Workspace context injection (metrics) | ✅ Shipped | v0.6 | P1 | Intelligence API |
| Knowledge context injection (top-K chunks) | 🗓 Planned | v1.3 | P0 | RAG layer |
| Anthropic Claude provider | 🗓 Planned | v1.3 | P1 | Provider abstraction |
| Multi-provider routing | 🗓 Planned | v1.4 | P2 | Provider abstraction |
| Model Context Protocol (MCP) support | 🗓 Planned | v2.0 | P1 | Agent runtime |

---

## Integrations

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Google Calendar sync | 🗓 Planned | v1.2 | P0 | Google OAuth |
| Google Gmail ingestion | 🗓 Planned | v1.2 | P0 | Google OAuth |
| Google Contacts sync | 🗓 Planned | v1.2 | P1 | Google OAuth |
| Google Drive document ingestion | 🗓 Planned | v1.2 | P1 | Google OAuth + pipeline |
| OAuth credential store (per-workspace, encrypted) | 🗓 Planned | v1.2 | P0 | Supabase secrets |
| Webhook + polling sync engine | 🗓 Planned | v1.2 | P1 | Integration framework |
| Slack integration | 🔬 Research | v1.x+ | P2 | Integration framework |
| Microsoft 365 | 🔬 Research | v1.x+ | P2 | Microsoft Graph API |
| Zapier / Make webhook | 🔬 Research | v2.x | P2 | Automation engine |

---

## Automation

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Workflow Engine (event-driven action graph) | 🗓 Planned | v1.4 | P0 | — |
| Approval Engine | 🗓 Planned | v1.4 | P0 | Workflow engine |
| Automation Builder (no-code rule editor) | 🗓 Planned | v1.4 | P1 | Workflow engine |
| Notifications (email, in-app, push) | 🗓 Planned | v1.4 | P0 | Workflow engine |
| Scheduled Actions (cron-style) | 🗓 Planned | v1.4 | P1 | Workflow engine |
| Automation audit log | 🗓 Planned | v1.4 | P1 | Audit log framework |

---

## Voice

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Voice Assistant (conversational interface) | 🗓 Planned | v1.5 | P0 | AI runtime |
| Speech-to-Text (real-time transcription) | 🗓 Planned | v1.5 | P0 | STT provider |
| Text-to-Speech (AI responses read aloud) | 🗓 Planned | v1.5 | P1 | TTS provider |
| Conversation Streaming (low-latency voice pipeline) | 🗓 Planned | v1.5 | P0 | Streaming runtime |
| Wake Word (hands-free activation) | 🗓 Planned | v1.5 | P2 | Wake word model |

---

## Multi-Agent System

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| Agent orchestration runtime | 🗓 Planned | v2.0 | P0 | — |
| Executive Agent (coordinator) | 🗓 Planned | v2.0 | P0 | Agent runtime |
| Sales Agent | 🗓 Planned | v2.0 | P0 | Agent runtime + CRM |
| Finance Agent | 🗓 Planned | v2.0 | P0 | Agent runtime |
| Marketing Agent | 🗓 Planned | v2.0 | P0 | Agent runtime |
| HR Agent | 🗓 Planned | v2.0 | P1 | Agent runtime |
| Operations Agent | 🗓 Planned | v2.0 | P1 | Agent runtime |
| Research Agent | 🗓 Planned | v2.0 | P1 | Agent runtime |
| Inter-agent messaging protocol | 🗓 Planned | v2.0 | P0 | Agent runtime |
| Agent memory (per-agent + shared knowledge graph) | 🗓 Planned | v2.0 | P0 | Knowledge Engine |
| Human-in-the-loop approval gates | 🗓 Planned | v2.0 | P0 | Approval engine |
| Agent audit trail | 🗓 Planned | v2.0 | P0 | Audit log framework |

---

## Security & Compliance

| Feature | Status | Release | Priority | Dependencies |
|---|---|---|---|---|
| RLS on all database tables | ✅ Shipped | v0.3 | P0 | Supabase |
| httpOnly auth cookies | ✅ Shipped | v0.3 | P0 | `@supabase/ssr` |
| Service-role key server-side only | ✅ Shipped | v1.0 | P0 | Admin client |
| PostgREST filter injection hardening | ✅ Shipped | v1.1 | P0 | — |
| Audit Logs | 🗓 Planned | v1.3 | P0 | — |
| MFA (TOTP) | 🗓 Planned | v1.x | P1 | Supabase MFA |
| SSO (SAML / OIDC) | 🗓 Planned | Enterprise | P1 | Identity provider |
| RBAC (role-based access control) | 🗓 Planned | v1.3 | P1 | Roles system |
| Encryption at rest (field-level) | 🗓 Planned | Enterprise | P1 | Supabase Vault |
| SOC 2 Type II | 🔬 Research | Enterprise | P0 | Audit program |
| GDPR compliance | 🔬 Research | Enterprise | P1 | Data processing |
