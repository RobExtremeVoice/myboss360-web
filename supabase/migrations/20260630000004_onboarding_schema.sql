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
