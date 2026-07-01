-- =============================================================================
-- MyBoss360 — Sprint 20B: Gmail Intelligence Engine (Part 2 — Sync State)
-- Migration: 20260701000003_gmail_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- gmail_sync_state — one row per google_connection; tracks incremental sync
-- ---------------------------------------------------------------------------
-- history_id is the Google historyId snapshot taken at the end of every sync.
-- On the next run, history.list?startHistoryId=<history_id> returns only the
-- changes since that point, preventing full re-ingestion.
-- ---------------------------------------------------------------------------
CREATE TABLE gmail_sync_state (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id         UUID        NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  history_id            TEXT,
  last_sync_at          TIMESTAMPTZ,
  total_threads_synced  INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id)
);

CREATE TRIGGER gmail_sync_state_updated_at
  BEFORE UPDATE ON gmail_sync_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gss_connection ON gmail_sync_state(connection_id);
CREATE INDEX idx_gss_last_sync  ON gmail_sync_state(last_sync_at);

ALTER TABLE gmail_sync_state ENABLE ROW LEVEL SECURITY;

-- Access is gated through google_connections so only the owning user can read/write.
CREATE POLICY "gmail sync state owner can select"
  ON gmail_sync_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail sync state owner can insert"
  ON gmail_sync_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail sync state owner can update"
  ON gmail_sync_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail sync state owner can delete"
  ON gmail_sync_state FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );
