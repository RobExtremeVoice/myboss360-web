# Environments

MyBoss360 should use separate infrastructure for local development, staging, and production. The goal is to isolate data, auth, and deployments so validation can happen safely before production rollout.

## Local

Purpose:
- feature development
- UI work
- repository and service iteration
- migration and seed review before pushing upstream

Recommended configuration:
- local `.env.local`
- local Next.js dev server
- a dedicated Supabase project for development or a disposable personal sandbox
- Vercel local development only when needed

Typical variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Staging

Purpose:
- pre-production verification
- migration rehearsal
- auth flow validation
- seed and RLS checks
- stakeholder review before production deployment

Recommended configuration:
- separate Supabase project from production
- separate Vercel project or a staging environment within the same Vercel project
- separate auth users, workspaces, and seed data

Staging should mirror production settings closely:
- same schema migrations
- same auth providers when possible
- same environment variable names
- same build pipeline

## Production

Purpose:
- customer-facing traffic
- real auth identities
- real workspace and organization data

Production rules:
- never share the Supabase project with local or staging
- never reuse staging seed data directly
- apply migrations only after staging validation
- protect environment variables through Vercel project settings

## Environment Variables

Current app-level variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Guidelines:
- local values live in `.env.local`
- staging values live in Vercel's staging/preview environment configuration
- production values live in Vercel's production environment configuration
- do not point multiple environments at the same Supabase project unless that is an intentional short-term bootstrap decision

## Supabase Project Separation

Recommended layout:
- `myboss360-dev`
- `myboss360-staging`
- `myboss360-production`

Why separate them:
- auth users stay isolated
- RLS and membership behavior can be tested safely
- migrations can be rehearsed before production
- seed data does not pollute production analytics or CRM records

Migration flow:
1. Create the SQL migration locally.
2. Validate on local or dev Supabase.
3. Push to staging and verify auth, RLS, and seed behavior.
4. Push the same migration to production after staging sign-off.

## Vercel Environment Separation

Recommended layout:
- local development on the workstation
- preview deployments for branches and pull requests
- staging deployment for release candidate validation
- production deployment from the protected main release path

Preview and staging should never point to production Supabase unless explicitly required for a controlled incident workflow.

## Deployment Flow

Recommended flow:
1. Develop locally.
2. Open a pull request.
3. Let CI run `npm ci`, `npm run lint`, and `npm run build`.
4. Review the preview deployment.
5. Apply migrations to staging.
6. Validate auth, RLS, CRM, and seed behavior in staging.
7. Promote to production.
8. Apply the already-validated migrations to production.

## Operational Notes

- Seed data should be run only after migrations complete successfully.
- The first admin user should be created through Supabase Auth, then attached to the organization and workspace through the seed workflow.
- If staging and production diverge, reconcile migrations first before troubleshooting app-level behavior.
