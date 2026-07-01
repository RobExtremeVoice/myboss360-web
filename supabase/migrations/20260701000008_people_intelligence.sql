-- =============================================================================
-- MyBoss360 — Sprint 20C: People Intelligence Engine
-- Migration: 20260701000008_people_intelligence.sql
-- =============================================================================
-- Creates 5 tables:
--   people_profiles   — unified person entity, deduplicated by email per workspace
--   people_relationships — executive ↔ person relationship metadata per context
--   people_interactions  — individual interaction events (email, meeting, CRM)
--   people_signals       — intelligence signals (going cold, champion, etc.)
--   people_scores        — score snapshots for trend analysis
-- All tables: RLS enabled, workspace + organization scoped.
-- =============================================================================

-- ── people_profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_profiles (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  email                 TEXT        NOT NULL,
  full_name             TEXT,
  job_title             TEXT,
  company_name          TEXT,

  company_id            UUID        REFERENCES companies(id) ON DELETE SET NULL,
  crm_contact_id        UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  gmail_contact_id      UUID        REFERENCES gmail_contacts(id) ON DELETE SET NULL,

  -- Which sources contributed to this profile
  sources               TEXT[]      NOT NULL DEFAULT '{}',

  -- Computed scores (0–100, updated by people engine)
  relationship_strength INTEGER     NOT NULL DEFAULT 0,
  engagement_score      INTEGER     NOT NULL DEFAULT 0,
  influence_score       INTEGER     NOT NULL DEFAULT 0,

  -- Classification flags
  is_champion           BOOLEAN     NOT NULL DEFAULT false,
  is_decision_maker     BOOLEAN     NOT NULL DEFAULT false,
  is_stale              BOOLEAN     NOT NULL DEFAULT false,
  is_new_relationship   BOOLEAN     NOT NULL DEFAULT false,

  -- Interaction counters
  email_count           INTEGER     NOT NULL DEFAULT 0,
  meeting_count         INTEGER     NOT NULL DEFAULT 0,
  last_interaction_at   TIMESTAMPTZ,
  first_interaction_at  TIMESTAMPTZ,

  -- Follow-up intelligence
  awaiting_reply        BOOLEAN     NOT NULL DEFAULT false,
  follow_up_required    BOOLEAN     NOT NULL DEFAULT false,
  follow_up_due         TIMESTAMPTZ,

  -- Metadata and scoring state
  metadata              JSONB       NOT NULL DEFAULT '{}',
  last_scored_at        TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT people_profiles_email_workspace_unique UNIQUE (workspace_id, email)
);

ALTER TABLE people_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_profiles_workspace_policy ON people_profiles
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_pp_workspace ON people_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pp_organization ON people_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pp_email ON people_profiles(workspace_id, email);
CREATE INDEX IF NOT EXISTS idx_pp_company ON people_profiles(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_crm_contact ON people_profiles(crm_contact_id) WHERE crm_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_champion ON people_profiles(workspace_id, is_champion) WHERE is_champion = true;
CREATE INDEX IF NOT EXISTS idx_pp_decision_maker ON people_profiles(workspace_id, is_decision_maker) WHERE is_decision_maker = true;
CREATE INDEX IF NOT EXISTS idx_pp_stale ON people_profiles(workspace_id, is_stale) WHERE is_stale = true;
CREATE INDEX IF NOT EXISTS idx_pp_relationship_strength ON people_profiles(workspace_id, relationship_strength DESC);
CREATE INDEX IF NOT EXISTS idx_pp_last_interaction ON people_profiles(workspace_id, last_interaction_at DESC);

-- ── people_relationships ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_relationships (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID        NOT NULL,
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  person_profile_id     UUID        NOT NULL REFERENCES people_profiles(id) ON DELETE CASCADE,

  relationship_type     TEXT        NOT NULL DEFAULT 'contact',
  relationship_strength INTEGER     NOT NULL DEFAULT 0,
  source                TEXT        NOT NULL DEFAULT 'crm',
  source_id             TEXT,

  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT people_relationships_type_check CHECK (
    relationship_type IN ('champion', 'decision_maker', 'influencer', 'collaborator', 'contact')
  ),
  CONSTRAINT people_relationships_source_check CHECK (
    source IN ('crm', 'gmail', 'calendar')
  )
);

ALTER TABLE people_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_relationships_workspace_policy ON people_relationships
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_pr_workspace ON people_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pr_person_profile ON people_relationships(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_pr_type ON people_relationships(workspace_id, relationship_type);

-- ── people_interactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_interactions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID        NOT NULL,
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  person_profile_id     UUID        NOT NULL REFERENCES people_profiles(id) ON DELETE CASCADE,

  interaction_type      TEXT        NOT NULL,
  source                TEXT        NOT NULL,
  source_id             TEXT,
  direction             TEXT,
  subject               TEXT,
  occurred_at           TIMESTAMPTZ NOT NULL,

  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT people_interactions_type_check CHECK (
    interaction_type IN ('email_sent', 'email_received', 'meeting', 'crm_activity')
  ),
  CONSTRAINT people_interactions_source_check CHECK (
    source IN ('crm', 'gmail', 'calendar')
  ),
  CONSTRAINT people_interactions_direction_check CHECK (
    direction IS NULL OR direction IN ('inbound', 'outbound', 'bidirectional')
  ),
  UNIQUE (workspace_id, person_profile_id, source, source_id)
);

ALTER TABLE people_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_interactions_workspace_policy ON people_interactions
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_pi_workspace ON people_interactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pi_person_profile ON people_interactions(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_occurred_at ON people_interactions(workspace_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_type ON people_interactions(workspace_id, interaction_type);

-- ── people_signals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_signals (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID        NOT NULL,
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  person_profile_id     UUID        NOT NULL REFERENCES people_profiles(id) ON DELETE CASCADE,

  signal_type           TEXT        NOT NULL,
  severity              TEXT        NOT NULL DEFAULT 'info',
  title                 TEXT        NOT NULL,
  description           TEXT,
  resolved_at           TIMESTAMPTZ,

  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT people_signals_type_check CHECK (
    signal_type IN (
      'going_cold',
      'champion_detected',
      'new_relationship',
      'decision_maker_identified',
      'awaiting_reply',
      'follow_up_overdue'
    )
  ),
  CONSTRAINT people_signals_severity_check CHECK (
    severity IN ('info', 'warning', 'critical')
  )
);

ALTER TABLE people_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_signals_workspace_policy ON people_signals
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_ps_workspace ON people_signals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ps_person_profile ON people_signals(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_ps_unresolved ON people_signals(workspace_id, signal_type)
  WHERE resolved_at IS NULL;

-- ── people_scores ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_scores (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  person_profile_id     UUID        NOT NULL REFERENCES people_profiles(id) ON DELETE CASCADE,

  relationship_strength INTEGER     NOT NULL DEFAULT 0,
  engagement_score      INTEGER     NOT NULL DEFAULT 0,
  influence_score       INTEGER     NOT NULL DEFAULT 0,

  scored_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE people_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_scores_workspace_policy ON people_scores
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE organization_id IN (
        SELECT organization_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_psc_workspace ON people_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_psc_person_profile ON people_scores(person_profile_id, scored_at DESC);
