# Supabase Setup

This project uses Supabase SSR auth with the Next.js App Router, Row Level Security, and a profile trigger that mirrors `auth.users` into `public.profiles`.

## 1. Link the Supabase project

Make sure the Supabase CLI is installed and you are authenticated first.

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

You can find the project ref in the Supabase dashboard URL or in the project settings.

## 2. Push migrations

From the project root, run:

```bash
supabase db push
```

Current migrations:

- `supabase/migrations/20260629000000_initial_schema.sql`
- `supabase/migrations/202606300001_fix_handle_new_user_security_definer.sql`

If you prefer the dashboard instead of the CLI, paste each migration into the Supabase SQL Editor in timestamp order.

## 3. Run the seed

After the project is active and the migrations have been applied:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Or use the SQL Editor and paste the contents of `supabase/seed.sql`.

Before running the seed:

1. Create the user account you want to use as the first admin through `/register`.
2. Copy that user UUID from Supabase Authentication.
3. Update the membership section in `supabase/seed.sql` or use the optional multi-user attachment block.

## 4. Create the first admin user

Recommended flow:

1. Register a real user through the app.
2. Confirm the email if confirmation is enabled in Supabase Auth.
3. Run the membership section in `supabase/seed.sql` for that user, or use the optional block that resolves users by email.

That flow keeps the auth identity in `auth.users` and then attaches the user to:

- the `Extreme Results Technologies` organization
- the `Executive Workspace`
- the `Admin` role

## 5. How the profile trigger works

`public.handle_new_user()` runs `AFTER INSERT` on `auth.users`.

Responsibilities:

- create a matching row in `public.profiles`
- copy `full_name` and `avatar_url` from `raw_user_meta_data`
- upsert safely if the profile already exists

The hardened migration sets `SECURITY DEFINER` with `search_path = public` so the trigger is explicit and safer for production use.

## 6. How RLS works

The schema uses helper functions plus workspace and organization membership checks:

- `is_org_member(org_id)` grants org-scoped visibility
- `is_workspace_member(ws_id)` grants workspace-scoped visibility

Core behavior:

- org members can read their organizations, roles, workspaces, memberships, subscriptions, and audit logs
- workspace members can read and mutate workspace-scoped CRM and operations data
- destructive hard deletes are not exposed through app repositories for core CRM records; companies, contacts, and deals use `deleted_at` soft delete updates instead
- notifications are user-scoped
- AI conversations and messages are both workspace-aware and user-scoped

## 7. Auth flow summary

Current application flow:

- `proxy.ts` protects `/dashboard/*` at the edge using `supabase.auth.getUser()`
- `app/(dashboard)/layout.tsx` revalidates the user server-side before rendering the authenticated shell
- `providers/AuthProvider.tsx` restores the client session and reacts to auth state changes
- login and register pages use Supabase browser auth and now surface normalized user-friendly error messages

## 8. Notes for local development

The CRM module may show a development-only fallback dataset when:

- the app is running outside production, and
- the current workspace has no live CRM records yet

Production should rely on real Supabase records and empty states instead of mock CRM data.
