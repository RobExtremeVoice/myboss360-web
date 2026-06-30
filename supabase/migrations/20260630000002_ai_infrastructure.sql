-- Sprint 17A: Add organization_id to ai_conversations for proper multi-tenant scoping.

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_organization_id
  ON ai_conversations(organization_id)
  WHERE organization_id IS NOT NULL;

-- Update RLS: allow members to read their workspace conversations
-- (existing RLS on ai_conversations is inherited; this index aids performance)
