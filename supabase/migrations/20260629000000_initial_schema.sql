-- =============================================================================
-- MyBoss360 — Initial Schema
-- Migration: 20260629000000_initial_schema.sql
-- Run via: Supabase dashboard → SQL Editor, or `supabase db push`
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram fuzzy search on names

-- ---------------------------------------------------------------------------
-- Helper: updated_at auto-stamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE SaaS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  website    TEXT,
  plan       TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users, auto-created on signup)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  phone      TEXT,
  timezone   TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  category    TEXT NOT NULL DEFAULT 'general',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- role_permissions
-- ---------------------------------------------------------------------------
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (organization_id, slug)
);

-- ---------------------------------------------------------------------------
-- memberships  (org-level: workspace_id IS NULL; workspace-level: set)
-- ---------------------------------------------------------------------------
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES roles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  invited_email   TEXT,
  invited_at      TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique indexes avoid NULL comparison issues
CREATE UNIQUE INDEX memberships_user_org_idx
  ON memberships (user_id, organization_id) WHERE workspace_id IS NULL;
CREATE UNIQUE INDEX memberships_user_org_ws_idx
  ON memberships (user_id, organization_id, workspace_id) WHERE workspace_id IS NOT NULL;

-- =============================================================================
-- RLS HELPER FUNCTIONS  (SECURITY DEFINER → run as postgres, bypasses RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND (
        m.workspace_id = ws_id
        OR (
          m.workspace_id IS NULL
          AND m.organization_id = (
            SELECT organization_id FROM workspaces WHERE id = ws_id
          )
        )
      )
  );
$$;

-- =============================================================================
-- CRM
-- =============================================================================

CREATE TABLE companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  domain       TEXT,
  industry     TEXT,
  size         TEXT,
  website      TEXT,
  phone        TEXT,
  address      JSONB DEFAULT '{}',
  notes        TEXT,
  tags         TEXT[] DEFAULT '{}',
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT,
  email        TEXT,
  phone        TEXT,
  job_title    TEXT,
  linkedin_url TEXT,
  notes        TEXT,
  tags         TEXT[] DEFAULT '{}',
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  source       TEXT,
  status       TEXT NOT NULL DEFAULT 'new',  -- new | contacted | qualified | disqualified
  assigned_to  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes        TEXT,
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id          UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  stage               TEXT NOT NULL DEFAULT 'prospect', -- prospect|qualified|proposal|negotiation|closed_won|closed_lost
  value               NUMERIC(15, 2),
  currency            TEXT NOT NULL DEFAULT 'USD',
  probability         INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  closed_at           TIMESTAMPTZ,
  assigned_to         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes               TEXT,
  metadata            JSONB DEFAULT '{}',
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,  -- note | call | email | meeting | task
  title        TEXT NOT NULL,
  body         TEXT,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES contacts(id) ON DELETE CASCADE,
  lead_id      UUID REFERENCES leads(id) ON DELETE CASCADE,
  deal_id      UUID REFERENCES deals(id) ON DELETE CASCADE,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- OPERATIONS
-- =============================================================================

CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active', -- active | on_hold | completed | archived
  priority     TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
  start_date   DATE,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  owner_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'todo',   -- todo | in_progress | in_review | done | cancelled
  priority       TEXT NOT NULL DEFAULT 'medium',
  assigned_to    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date       DATE,
  completed_at   TIMESTAMPTZ,
  metadata       JSONB DEFAULT '{}',
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE calendar_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  start_at     TIMESTAMPTZ NOT NULL,
  end_at       TIMESTAMPTZ NOT NULL,
  all_day      BOOLEAN NOT NULL DEFAULT false,
  recurrence   JSONB,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendees    UUID[] DEFAULT '{}',
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES documents(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content      TEXT,
  content_type TEXT NOT NULL DEFAULT 'markdown',
  is_folder    BOOLEAN NOT NULL DEFAULT false,
  storage_path TEXT,
  mime_type    TEXT,
  size_bytes   BIGINT,
  tags         TEXT[] DEFAULT '{}',
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  action_url   TEXT,
  read_at      TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- AI
-- =============================================================================

CREATE TABLE ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT,
  model        TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  tokens_used     INTEGER,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- BUSINESS
-- =============================================================================

CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'free',    -- free | starter | pro | enterprise
  status                 TEXT NOT NULL DEFAULT 'active',  -- active | trialing | past_due | canceled | unpaid
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  trial_end              TIMESTAMPTZ,
  canceled_at            TIMESTAMPTZ,
  metadata               JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,   -- e.g. 'deal.created', 'user.invited'
  resource_type   TEXT,
  resource_id     UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- organizations
CREATE INDEX org_deleted_idx ON organizations (deleted_at) WHERE deleted_at IS NULL;

-- workspaces
CREATE INDEX ws_org_idx     ON workspaces (organization_id);
CREATE INDEX ws_deleted_idx ON workspaces (deleted_at) WHERE deleted_at IS NULL;

-- memberships
CREATE INDEX mem_user_idx  ON memberships (user_id);
CREATE INDEX mem_org_idx   ON memberships (organization_id);
CREATE INDEX mem_ws_idx    ON memberships (workspace_id);
CREATE INDEX mem_stat_idx  ON memberships (status);

-- companies
CREATE INDEX co_ws_idx      ON companies (workspace_id);
CREATE INDEX co_del_idx     ON companies (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX co_name_trg    ON companies USING gin (name gin_trgm_ops);

-- contacts
CREATE INDEX ct_ws_idx      ON contacts (workspace_id);
CREATE INDEX ct_co_idx      ON contacts (company_id);
CREATE INDEX ct_email_idx   ON contacts (email);
CREATE INDEX ct_del_idx     ON contacts (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX ct_name_trg    ON contacts USING gin ((first_name || ' ' || COALESCE(last_name, '')) gin_trgm_ops);

-- leads
CREATE INDEX ld_ws_idx      ON leads (workspace_id);
CREATE INDEX ld_status_idx  ON leads (status);
CREATE INDEX ld_assign_idx  ON leads (assigned_to);
CREATE INDEX ld_del_idx     ON leads (deleted_at) WHERE deleted_at IS NULL;

-- deals
CREATE INDEX dl_ws_idx      ON deals (workspace_id);
CREATE INDEX dl_stage_idx   ON deals (stage);
CREATE INDEX dl_assign_idx  ON deals (assigned_to);
CREATE INDEX dl_del_idx     ON deals (deleted_at) WHERE deleted_at IS NULL;

-- activities
CREATE INDEX act_ws_idx     ON activities (workspace_id);
CREATE INDEX act_co_idx     ON activities (company_id);
CREATE INDEX act_ct_idx     ON activities (contact_id);
CREATE INDEX act_dl_idx     ON activities (deal_id);
CREATE INDEX act_time_idx   ON activities (occurred_at DESC);

-- projects
CREATE INDEX pr_ws_idx      ON projects (workspace_id);
CREATE INDEX pr_status_idx  ON projects (status);
CREATE INDEX pr_del_idx     ON projects (deleted_at) WHERE deleted_at IS NULL;

-- tasks
CREATE INDEX tk_ws_idx      ON tasks (workspace_id);
CREATE INDEX tk_proj_idx    ON tasks (project_id);
CREATE INDEX tk_assign_idx  ON tasks (assigned_to);
CREATE INDEX tk_status_idx  ON tasks (status);
CREATE INDEX tk_del_idx     ON tasks (deleted_at) WHERE deleted_at IS NULL;

-- calendar_events
CREATE INDEX ce_ws_idx      ON calendar_events (workspace_id);
CREATE INDEX ce_start_idx   ON calendar_events (start_at);
CREATE INDEX ce_del_idx     ON calendar_events (deleted_at) WHERE deleted_at IS NULL;

-- documents
CREATE INDEX doc_ws_idx     ON documents (workspace_id);
CREATE INDEX doc_par_idx    ON documents (parent_id);
CREATE INDEX doc_del_idx    ON documents (deleted_at) WHERE deleted_at IS NULL;

-- notifications
CREATE INDEX notif_user_idx ON notifications (user_id);
CREATE INDEX notif_unread   ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

-- ai_conversations
CREATE INDEX conv_ws_idx    ON ai_conversations (workspace_id);
CREATE INDEX conv_user_idx  ON ai_conversations (user_id);

-- ai_messages
CREATE INDEX msg_conv_idx   ON ai_messages (conversation_id);

-- subscriptions
CREATE INDEX sub_org_idx    ON subscriptions (organization_id);
CREATE INDEX sub_stripe_idx ON subscriptions (stripe_customer_id);

-- audit_logs
CREATE INDEX al_org_idx     ON audit_logs (organization_id);
CREATE INDEX al_ws_idx      ON audit_logs (workspace_id);
CREATE INDEX al_user_idx    ON audit_logs (user_id);
CREATE INDEX al_time_idx    ON audit_logs (created_at DESC);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER trg_upd_organizations   BEFORE UPDATE ON organizations   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_profiles        BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_roles           BEFORE UPDATE ON roles           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_workspaces      BEFORE UPDATE ON workspaces      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_memberships     BEFORE UPDATE ON memberships     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_companies       BEFORE UPDATE ON companies       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_contacts        BEFORE UPDATE ON contacts        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_leads           BEFORE UPDATE ON leads           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_deals           BEFORE UPDATE ON deals           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_activities      BEFORE UPDATE ON activities      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_projects        BEFORE UPDATE ON projects        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_tasks           BEFORE UPDATE ON tasks           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_calendar_events BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_documents       BEFORE UPDATE ON documents       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_ai_conversations BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_upd_subscriptions   BEFORE UPDATE ON subscriptions   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS: organizations
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select" ON organizations
  FOR SELECT USING (is_org_member(id));

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: roles
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select_roles" ON roles
  FOR SELECT USING (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- RLS: permissions  (read-only for all authenticated users)
-- ---------------------------------------------------------------------------
CREATE POLICY "authenticated_select_permissions" ON permissions
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- RLS: role_permissions
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select_role_perms" ON role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_id AND is_org_member(r.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: workspaces
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select_workspaces" ON workspaces
  FOR SELECT USING (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- RLS: memberships
-- is_org_member() is SECURITY DEFINER (runs as postgres superuser, bypasses
-- RLS) so using it here is safe and avoids infinite recursion.
-- ---------------------------------------------------------------------------
CREATE POLICY "own_memberships_select" ON memberships
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "org_members_see_memberships" ON memberships
  FOR SELECT USING (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- RLS: workspace-scoped tables (CRM + Ops + AI)
-- Macro: workspace members can SELECT/INSERT/UPDATE; no DELETE (soft-delete only)
-- ---------------------------------------------------------------------------

-- companies
CREATE POLICY "ws_select_companies" ON companies FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_companies" ON companies FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_companies" ON companies FOR UPDATE USING (is_workspace_member(workspace_id));

-- contacts
CREATE POLICY "ws_select_contacts" ON contacts FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_contacts" ON contacts FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_contacts" ON contacts FOR UPDATE USING (is_workspace_member(workspace_id));

-- leads
CREATE POLICY "ws_select_leads" ON leads FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_leads" ON leads FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_leads" ON leads FOR UPDATE USING (is_workspace_member(workspace_id));

-- deals
CREATE POLICY "ws_select_deals" ON deals FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_deals" ON deals FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_deals" ON deals FOR UPDATE USING (is_workspace_member(workspace_id));

-- activities
CREATE POLICY "ws_select_activities" ON activities FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_activities" ON activities FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_activities" ON activities FOR UPDATE USING (is_workspace_member(workspace_id));

-- projects
CREATE POLICY "ws_select_projects" ON projects FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_projects" ON projects FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_projects" ON projects FOR UPDATE USING (is_workspace_member(workspace_id));

-- tasks
CREATE POLICY "ws_select_tasks" ON tasks FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_tasks" ON tasks FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_tasks" ON tasks FOR UPDATE USING (is_workspace_member(workspace_id));

-- calendar_events
CREATE POLICY "ws_select_events" ON calendar_events FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_events" ON calendar_events FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_events" ON calendar_events FOR UPDATE USING (is_workspace_member(workspace_id));

-- documents
CREATE POLICY "ws_select_documents" ON documents FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_insert_documents" ON documents FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "ws_update_documents" ON documents FOR UPDATE USING (is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- RLS: notifications  (personal)
-- ---------------------------------------------------------------------------
CREATE POLICY "own_notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: ai_conversations  (own + workspace)
-- ---------------------------------------------------------------------------
CREATE POLICY "own_conversations_select" ON ai_conversations
  FOR SELECT USING (user_id = auth.uid() AND is_workspace_member(workspace_id));
CREATE POLICY "own_conversations_insert" ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));
CREATE POLICY "own_conversations_update" ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid() AND is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- RLS: ai_messages  (via conversation ownership)
-- ---------------------------------------------------------------------------
CREATE POLICY "own_messages_select" ON ai_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );
CREATE POLICY "own_messages_insert" ON ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RLS: subscriptions  (org members read; service role writes)
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select_subscription" ON subscriptions
  FOR SELECT USING (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- RLS: audit_logs  (org members read; service role writes)
-- ---------------------------------------------------------------------------
CREATE POLICY "org_members_select_audit_logs" ON audit_logs
  FOR SELECT USING (is_org_member(organization_id));

-- =============================================================================
-- SEED: system permissions
-- =============================================================================
INSERT INTO permissions (name, description, category) VALUES
  ('org.admin',        'Full organization administration',     'organization'),
  ('org.billing',      'Manage billing and subscriptions',     'organization'),
  ('members.invite',   'Invite members to the organization',   'organization'),
  ('members.remove',   'Remove members',                       'organization'),
  ('crm.read',         'View CRM records',                     'crm'),
  ('crm.write',        'Create and edit CRM records',          'crm'),
  ('crm.delete',       'Soft-delete CRM records',              'crm'),
  ('projects.read',    'View projects',                        'projects'),
  ('projects.write',   'Create and edit projects',             'projects'),
  ('tasks.read',       'View tasks',                           'tasks'),
  ('tasks.write',      'Create and edit tasks',                'tasks'),
  ('documents.read',   'View documents',                       'documents'),
  ('documents.write',  'Create and edit documents',            'documents'),
  ('ai.use',           'Use AI assistant',                     'ai'),
  ('audit_logs.read',  'View audit logs',                      'audit')
ON CONFLICT (name) DO NOTHING;
