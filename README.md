# MyBoss360

An AI-powered Executive Operating System. Aggregates email, calendar, CRM, and business intelligence into a single intelligent workspace for executives.

**Current release:** v1.2.1 (Architecture Freeze) · [Changelog](docs/roadmap/CHANGELOG.md) · [Release Board](docs/roadmap/RELEASE_BOARD.md)

---

## Developer Setup

### Prerequisites

- Node.js 22+
- A Supabase project (free tier works)
- OpenAI API key (for AI assistant)
- Google OAuth credentials (for Gmail/Calendar integrations)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

See [`.env.example`](.env.example) for all required variables with descriptions.

### 3. Set up the database

Run migrations against your Supabase project:

```bash
# From the Supabase dashboard: SQL Editor → paste each migration file in order
# Or with the Supabase CLI:
supabase db push
```

Seed demo data (optional):

```bash
# Paste supabase/seed.sql in the SQL Editor
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm start` | Start production server (after build) |

---

## Project Structure

```
app/                    Next.js App Router (pages, layouts, API routes)
  (auth)/               Login / register pages
  (dashboard)/          Executive dashboard and sub-pages
  (marketing)/          Public marketing homepage
  (onboarding)/         Onboarding wizard
  api/                  REST API routes (ai, calendar, gmail, google, intelligence, knowledge, onboarding, people)

components/             React components
  ai/                   AI chat, conversation sidebar, composer
  crm/                  CRM entity views
  dashboard/            Shell, sidebar, KPI cards, charts
  onboarding/           Wizard steps

config/                 Application configuration (CRM, knowledge, dashboard)

docs/                   Documentation
  architecture/         System, database, and AI architecture docs
  roadmap/              CHANGELOG, RELEASE_BOARD, FEATURE_MATRIX

lib/                    Shared utilities and infrastructure
  dates.ts              Date utilities (daysSince, daysUntil, clamp)
  supabase/             Supabase browser, server, and admin clients

repositories/           Typed database access layer
  crm/                  Companies, contacts, deals, activities
  knowledge/            Documents, chunks, collections, tags
  onboarding/           Onboarding state

services/               Business logic layer
  ai/                   Provider abstraction, OpenAI provider, prompt builder, registry
  crm/                  CRM service (companies, contacts, deals)
  dashboard/            Executive summary service
  google/               Gmail sync, OAuth, relationship intelligence, calendar API
  intelligence/         Signal engine, pattern detector, recommendation engine
  knowledge/            Document pipeline, search, knowledge service
  onboarding/           Onboarding service, workspace provisioning
  people/               People engine, people service

types/                  TypeScript type definitions
  ai.ts, crm.ts, intelligence.ts, knowledge.ts, learning.ts, onboarding.ts, ...

tests/                  Unit and integration tests (vitest)
  lib/, repositories/, services/
```

---

## Architecture

See [docs/architecture/](docs/architecture/) for:
- [System Architecture](docs/architecture/system-architecture.md)
- [Database ERD](docs/architecture/database-erd.md)
- [AI Architecture](docs/architecture/ai-architecture.md)
- [Intelligence Architecture](docs/intelligence-architecture.md)
- [People Intelligence](docs/people-intelligence.md)

---

## Key Design Decisions

- **Next.js App Router** — all dashboard pages are React Server Components by default; `"use client"` is added only where interactivity requires it
- **Supabase RLS** — every table has Row-Level Security enforced via `is_org_member()` / `is_workspace_member()` functions; service-role client used only for provisioning
- **Repository pattern** — all DB access goes through typed repositories; services never call `supabase.from()` directly
- **Edge middleware** — `middleware.ts` enforces auth at the CDN edge for all `/dashboard/*` routes before any server component runs
- **Pluggable AI providers** — `services/ai/provider-registry.ts` allows swapping between OpenAI, Anthropic, or other providers without changing the chat layer
