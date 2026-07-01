-- =============================================================================
-- MyBoss360 — Sprint 20B: Gmail Relationship Intelligence Engine (Parts 5, 6, 7)
-- Migration: 20260701000005_gmail_relationship_intelligence.sql
-- =============================================================================
-- Extends existing Gmail intelligence tables with:
--   - Company intelligence linkage
--   - Follow-up intelligence fields
--   - Response status intelligence fields
-- =============================================================================

ALTER TABLE gmail_contacts
  ADD COLUMN IF NOT EXISTS normalized_domain TEXT,
  ADD COLUMN IF NOT EXISTS crm_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_confidence_score NUMERIC(5,2);

UPDATE gmail_contacts
SET normalized_domain = lower(domain)
WHERE normalized_domain IS NULL;

CREATE INDEX IF NOT EXISTS idx_gcon_normalized_domain
  ON gmail_contacts(workspace_id, normalized_domain)
  WHERE normalized_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gcon_company
  ON gmail_contacts(crm_company_id)
  WHERE crm_company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gcon_company_confidence
  ON gmail_contacts(workspace_id, company_confidence_score DESC)
  WHERE company_confidence_score IS NOT NULL;

ALTER TABLE gmail_threads
  ADD COLUMN IF NOT EXISTS response_status TEXT NOT NULL DEFAULT 'conversation_active',
  ADD COLUMN IF NOT EXISTS conversation_age_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thread_health TEXT NOT NULL DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_due TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS days_waiting INTEGER,
  ADD COLUMN IF NOT EXISTS follow_up_priority TEXT;

CREATE INDEX IF NOT EXISTS idx_gthr_response_status
  ON gmail_threads(workspace_id, response_status);

CREATE INDEX IF NOT EXISTS idx_gthr_follow_up_due
  ON gmail_threads(workspace_id, follow_up_required, follow_up_due)
  WHERE follow_up_required = true;

CREATE INDEX IF NOT EXISTS idx_gthr_thread_health
  ON gmail_threads(workspace_id, thread_health);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gmail_threads_response_status_check'
  ) THEN
    ALTER TABLE gmail_threads
      ADD CONSTRAINT gmail_threads_response_status_check
      CHECK (response_status IN (
        'waiting_for_me',
        'waiting_for_customer',
        'conversation_closed',
        'conversation_active'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gmail_threads_thread_health_check'
  ) THEN
    ALTER TABLE gmail_threads
      ADD CONSTRAINT gmail_threads_thread_health_check
      CHECK (thread_health IN ('healthy', 'watch', 'stale', 'critical', 'closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gmail_threads_follow_up_priority_check'
  ) THEN
    ALTER TABLE gmail_threads
      ADD CONSTRAINT gmail_threads_follow_up_priority_check
      CHECK (follow_up_priority IS NULL OR follow_up_priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;
