-- =============================================================================
-- MyBoss360 — Sprint 20B: Gmail Memory + Learning Extensions (Parts 10–13)
-- Migration: 20260701000007_gmail_memory_learning_extensions.sql
-- =============================================================================

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS importance TEXT NOT NULL DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS idx_memories_source_id
  ON memories(workspace_id, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_importance
  ON memories(workspace_id, importance);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memories_importance_check'
  ) THEN
    ALTER TABLE memories
      ADD CONSTRAINT memories_importance_check
      CHECK (importance IN ('low', 'normal', 'high', 'critical'));
  END IF;
END $$;

ALTER TABLE learning_signals
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50;

CREATE INDEX IF NOT EXISTS idx_learning_signals_confidence
  ON learning_signals(workspace_id, confidence DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'learning_signals_confidence_check'
  ) THEN
    ALTER TABLE learning_signals
      ADD CONSTRAINT learning_signals_confidence_check
      CHECK (confidence >= 0 AND confidence <= 1);
  END IF;
END $$;
