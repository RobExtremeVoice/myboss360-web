-- =============================================================================
-- MyBoss360 — Sprint 15.5: Memory Engine & Learning Engine Schema
-- Migration: 20260630000001_intelligence_schema.sql
-- =============================================================================

-- =============================================================================
-- MEMORY ENGINE
-- =============================================================================

CREATE TABLE memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  -- user_preference | org_goal | workspace_context | decision | meeting_summary
  -- observation | executive_note | ai_insight | historical_recommendation
  -- accepted_recommendation | rejected_recommendation
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  source          TEXT DEFAULT 'manual',
  -- manual | ai_generated | crm_event | system
  entity_type     TEXT,
  -- company | contact | deal | project | task | workspace | organization
  entity_id       UUID,
  confidence      NUMERIC(3, 2),  -- 0.00–1.00, populated for ai_generated memories
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  expires_at      TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE memory_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id   UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,  -- created | updated | accessed | archived | expired
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- LEARNING ENGINE
-- =============================================================================

CREATE TABLE learning_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  signal_type     TEXT NOT NULL,
  -- deal_risk | follow_up_delay | task_delay | customer_health
  -- sales_pattern | recurring_bottleneck | performance_trend | recommended_action
  entity_type     TEXT,
  entity_id       UUID,
  severity        TEXT NOT NULL DEFAULT 'info',  -- info | warning | critical
  title           TEXT NOT NULL,
  description     TEXT,
  data            JSONB NOT NULL DEFAULT '{}',
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE learning_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pattern_type    TEXT NOT NULL,
  -- sales | deal_risk | follow_up | task_completion | customer_health | bottleneck | performance
  name            TEXT NOT NULL,
  description     TEXT,
  confidence      NUMERIC(3, 2) NOT NULL DEFAULT 0.50,
  occurrences     INTEGER NOT NULL DEFAULT 1,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  data            JSONB NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pattern_id      UUID REFERENCES learning_patterns(id) ON DELETE SET NULL,
  signal_id       UUID REFERENCES learning_signals(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,  -- action | insight | warning | opportunity
  priority        TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  action_label    TEXT,
  action_url      TEXT,
  entity_type     TEXT,
  entity_id       UUID,
  status          TEXT NOT NULL DEFAULT 'pending',
  -- pending | accepted | rejected | dismissed | expired
  expires_at      TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE recommendation_feedback (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action            TEXT NOT NULL,  -- accepted | rejected | dismissed
  rating            SMALLINT CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER learning_signals_updated_at
  BEFORE UPDATE ON learning_signals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER learning_patterns_updated_at
  BEFORE UPDATE ON learning_patterns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- memories
CREATE INDEX idx_memories_workspace_id         ON memories (workspace_id);
CREATE INDEX idx_memories_organization_id      ON memories (organization_id);
CREATE INDEX idx_memories_type                 ON memories (type);
CREATE INDEX idx_memories_entity               ON memories (entity_type, entity_id);
CREATE INDEX idx_memories_user_id              ON memories (user_id);
CREATE INDEX idx_memories_created_at           ON memories (created_at DESC);
CREATE INDEX idx_memories_is_pinned            ON memories (workspace_id, is_pinned) WHERE is_pinned = true;

-- memory_events
CREATE INDEX idx_memory_events_memory_id  ON memory_events (memory_id);
CREATE INDEX idx_memory_events_created_at ON memory_events (created_at DESC);

-- learning_signals
CREATE INDEX idx_learning_signals_workspace_id    ON learning_signals (workspace_id);
CREATE INDEX idx_learning_signals_organization_id ON learning_signals (organization_id);
CREATE INDEX idx_learning_signals_signal_type     ON learning_signals (signal_type);
CREATE INDEX idx_learning_signals_entity          ON learning_signals (entity_type, entity_id);
CREATE INDEX idx_learning_signals_severity        ON learning_signals (severity);
CREATE INDEX idx_learning_signals_detected_at     ON learning_signals (detected_at DESC);
CREATE INDEX idx_learning_signals_unresolved      ON learning_signals (workspace_id) WHERE resolved_at IS NULL;

-- learning_patterns
CREATE INDEX idx_learning_patterns_workspace_id    ON learning_patterns (workspace_id);
CREATE INDEX idx_learning_patterns_organization_id ON learning_patterns (organization_id);
CREATE INDEX idx_learning_patterns_pattern_type    ON learning_patterns (pattern_type);
CREATE INDEX idx_learning_patterns_confidence      ON learning_patterns (confidence DESC);

-- recommendations
CREATE INDEX idx_recommendations_workspace_id    ON recommendations (workspace_id);
CREATE INDEX idx_recommendations_organization_id ON recommendations (organization_id);
CREATE INDEX idx_recommendations_user_id         ON recommendations (user_id);
CREATE INDEX idx_recommendations_status          ON recommendations (status);
CREATE INDEX idx_recommendations_priority        ON recommendations (priority);
CREATE INDEX idx_recommendations_entity          ON recommendations (entity_type, entity_id);
CREATE INDEX idx_recommendations_created_at      ON recommendations (created_at DESC);

-- recommendation_feedback
CREATE INDEX idx_rec_feedback_recommendation_id ON recommendation_feedback (recommendation_id);
CREATE INDEX idx_rec_feedback_user_id           ON recommendation_feedback (user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE memories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_signals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- memories: workspace-scoped read/write
CREATE POLICY "workspace members can read memories"
  ON memories FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can insert memories"
  ON memories FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can update memories"
  ON memories FOR UPDATE
  USING (is_workspace_member(workspace_id));

-- memory_events: accessible to members of the parent memory's workspace
CREATE POLICY "workspace members can read memory events"
  ON memory_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_events.memory_id
        AND is_workspace_member(m.workspace_id)
    )
  );

CREATE POLICY "workspace members can insert memory events"
  ON memory_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_events.memory_id
        AND is_workspace_member(m.workspace_id)
    )
  );

-- learning_signals
CREATE POLICY "workspace members can read signals"
  ON learning_signals FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can insert signals"
  ON learning_signals FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can update signals"
  ON learning_signals FOR UPDATE
  USING (is_workspace_member(workspace_id));

-- learning_patterns
CREATE POLICY "workspace members can read patterns"
  ON learning_patterns FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can insert patterns"
  ON learning_patterns FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can update patterns"
  ON learning_patterns FOR UPDATE
  USING (is_workspace_member(workspace_id));

-- recommendations
CREATE POLICY "workspace members can read recommendations"
  ON recommendations FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can insert recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "workspace members can update recommendations"
  ON recommendations FOR UPDATE
  USING (is_workspace_member(workspace_id));

-- recommendation_feedback: users can read/write their own feedback
CREATE POLICY "users can read own feedback"
  ON recommendation_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users can insert own feedback"
  ON recommendation_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());
