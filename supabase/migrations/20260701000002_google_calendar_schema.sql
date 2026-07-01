-- =============================================================================
-- MyBoss360 — Sprint 20A: Google Identity & Calendar Foundation
-- Migration: 20260701000002_google_calendar_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- google_connections — one row per (workspace, user) Google account link
-- ---------------------------------------------------------------------------
CREATE TABLE google_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_account_email TEXT NOT NULL,
  scopes              TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'active',
  -- active | revoked | error
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TRIGGER google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gc_workspace ON google_connections(workspace_id);
CREATE INDEX idx_gc_user ON google_connections(user_id);
CREATE INDEX idx_gc_status ON google_connections(workspace_id, status);

ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can read own connections"
  ON google_connections FOR SELECT
  USING (is_workspace_member(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "workspace members can insert own connections"
  ON google_connections FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "workspace members can update own connections"
  ON google_connections FOR UPDATE
  USING (is_workspace_member(workspace_id) AND auth.uid() = user_id);

CREATE POLICY "workspace members can delete own connections"
  ON google_connections FOR DELETE
  USING (is_workspace_member(workspace_id) AND auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- google_tokens — OAuth tokens per connection (refresh + access, AES-encrypted)
-- ---------------------------------------------------------------------------
CREATE TABLE google_tokens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id       UUID NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  access_token_enc    TEXT NOT NULL,
  -- AES-256-GCM: iv:tag:ciphertext (hex)
  refresh_token_enc   TEXT NOT NULL,
  -- AES-256-GCM: iv:tag:ciphertext (hex)
  token_type          TEXT NOT NULL DEFAULT 'Bearer',
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id)
);

CREATE TRIGGER google_tokens_updated_at
  BEFORE UPDATE ON google_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gt_connection ON google_tokens(connection_id);
CREATE INDEX idx_gt_expires ON google_tokens(expires_at);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Tokens are only readable by the owning user (via join)
CREATE POLICY "token owner can read"
  ON google_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "token owner can insert"
  ON google_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "token owner can update"
  ON google_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- calendar_sync_state — incremental sync tracking per calendar
-- ---------------------------------------------------------------------------
CREATE TABLE calendar_sync_state (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id       UUID NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  calendar_id         TEXT NOT NULL,
  -- Google calendar ID (e.g. 'primary' or email)
  sync_token          TEXT,
  -- Google nextSyncToken for incremental syncs
  next_page_token     TEXT,
  -- for paginated full syncs in progress
  last_synced_at      TIMESTAMPTZ,
  total_events_synced INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, calendar_id)
);

CREATE TRIGGER calendar_sync_state_updated_at
  BEFORE UPDATE ON calendar_sync_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_css_connection ON calendar_sync_state(connection_id);
CREATE INDEX idx_css_last_sync ON calendar_sync_state(last_synced_at);

ALTER TABLE calendar_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync state owner can read"
  ON calendar_sync_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "sync state owner can insert"
  ON calendar_sync_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "sync state owner can update"
  ON calendar_sync_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );
