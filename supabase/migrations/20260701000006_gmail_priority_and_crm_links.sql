-- =============================================================================
-- MyBoss360 — Sprint 20B: Gmail Priority + CRM Email Relationships (Parts 8, 9)
-- Migration: 20260701000006_gmail_priority_and_crm_links.sql
-- =============================================================================

ALTER TABLE gmail_threads
  ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_label TEXT NOT NULL DEFAULT 'fyi';

CREATE INDEX IF NOT EXISTS idx_gthr_priority_score
  ON gmail_threads(workspace_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_gthr_priority_label
  ON gmail_threads(workspace_id, priority_label);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gmail_threads_priority_score_check'
  ) THEN
    ALTER TABLE gmail_threads
      ADD CONSTRAINT gmail_threads_priority_score_check
      CHECK (priority_score >= 0 AND priority_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gmail_threads_priority_label_check'
  ) THEN
    ALTER TABLE gmail_threads
      ADD CONSTRAINT gmail_threads_priority_label_check
      CHECK (priority_label IN ('critical', 'high', 'normal', 'low', 'fyi'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS crm_email_links (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  gmail_thread_id  UUID         NOT NULL REFERENCES gmail_threads(id) ON DELETE CASCADE,
  entity_type      TEXT         NOT NULL,
  entity_id        UUID         NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  match_reason     TEXT         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (gmail_thread_id, entity_type, entity_id)
);

CREATE TRIGGER crm_email_links_updated_at
  BEFORE UPDATE ON crm_email_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_cel_workspace
  ON crm_email_links(workspace_id);

CREATE INDEX IF NOT EXISTS idx_cel_thread
  ON crm_email_links(gmail_thread_id);

CREATE INDEX IF NOT EXISTS idx_cel_entity
  ON crm_email_links(workspace_id, entity_type, entity_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_email_links_entity_type_check'
  ) THEN
    ALTER TABLE crm_email_links
      ADD CONSTRAINT crm_email_links_entity_type_check
      CHECK (entity_type IN ('contact', 'company', 'deal'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_email_links_confidence_score_check'
  ) THEN
    ALTER TABLE crm_email_links
      ADD CONSTRAINT crm_email_links_confidence_score_check
      CHECK (confidence_score >= 0 AND confidence_score <= 1);
  END IF;
END $$;

ALTER TABLE crm_email_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm email links owner can select"
  ON crm_email_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM gmail_threads gt
      JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id
        AND gt.workspace_id = workspace_id
        AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "crm email links owner can insert"
  ON crm_email_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM gmail_threads gt
      JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id
        AND gt.workspace_id = workspace_id
        AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "crm email links owner can update"
  ON crm_email_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM gmail_threads gt
      JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id
        AND gt.workspace_id = workspace_id
        AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "crm email links owner can delete"
  ON crm_email_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM gmail_threads gt
      JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id
        AND gt.workspace_id = workspace_id
        AND gc.user_id = auth.uid()
    )
  );
