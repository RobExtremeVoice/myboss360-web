-- =============================================================================
-- MyBoss360 — Sprint 19: Executive Knowledge Engine (RAG Foundation)
-- Migration: 20260701000001_knowledge_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- knowledge_collections  (logical groupings of documents)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (workspace_id, slug)
);

CREATE TRIGGER knowledge_collections_updated_at
  BEFORE UPDATE ON knowledge_collections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_kc_workspace ON knowledge_collections(workspace_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- knowledge_sources  (origin systems for documents)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'manual',
  -- manual | import | crm | calendar | email | integration
  config          JSONB NOT NULL DEFAULT '{}',
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER knowledge_sources_updated_at
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_ks_workspace ON knowledge_sources(workspace_id);

-- ---------------------------------------------------------------------------
-- knowledge_documents  (core knowledge entity)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  collection_id   UUID REFERENCES knowledge_collections(id) ON DELETE SET NULL,
  source_id       UUID REFERENCES knowledge_sources(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  object_type     TEXT NOT NULL,
  -- company_profile | policy | procedure | sop | product | service | playbook
  -- contract | meeting_notes | document | executive_decision | customer_notes
  -- project_documentation | email | calendar_event
  category        TEXT NOT NULL,
  -- executive | meeting | policy | playbook | hr | finance | legal | marketing | operations
  status          TEXT NOT NULL DEFAULT 'draft',
  -- draft | published | archived
  version         INTEGER NOT NULL DEFAULT 1,
  word_count      INTEGER,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TRIGGER knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_kd_workspace        ON knowledge_documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kd_collection       ON knowledge_documents(collection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kd_object_type      ON knowledge_documents(workspace_id, object_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_kd_category         ON knowledge_documents(workspace_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_kd_status           ON knowledge_documents(workspace_id, status) WHERE deleted_at IS NULL;
-- Trigram index for keyword search (pg_trgm extension required — already enabled)
CREATE INDEX idx_kd_title_trgm ON knowledge_documents USING gin(title gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_kd_content_trgm ON knowledge_documents USING gin(content gin_trgm_ops) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- knowledge_chunks  (document fragments for future vector/RAG search)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_chunks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  chunk_index    INTEGER NOT NULL,
  content        TEXT NOT NULL,
  chunk_strategy TEXT NOT NULL DEFAULT 'paragraph',
  -- paragraph | sentence | fixed_size | semantic
  token_count    INTEGER,
  embedding_id   TEXT,  -- future: reference to vector store (pgvector rowid or external ID)
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_kchunk_document   ON knowledge_chunks(document_id);
CREATE INDEX idx_kchunk_workspace  ON knowledge_chunks(workspace_id);
CREATE INDEX idx_kchunk_embedding  ON knowledge_chunks(embedding_id) WHERE embedding_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- knowledge_tags  (workspace-scoped tagging system)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  color        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TRIGGER knowledge_tags_updated_at
  BEFORE UPDATE ON knowledge_tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- document_tags  (many-to-many: documents ↔ tags)
-- ---------------------------------------------------------------------------
CREATE TABLE document_tags (
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES knowledge_tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX idx_dtags_tag ON document_tags(tag_id);

-- ---------------------------------------------------------------------------
-- knowledge_links  (typed relationships between documents)
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_links (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  link_type          TEXT NOT NULL DEFAULT 'related',
  -- references | supersedes | related | prerequisite
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, target_document_id, link_type)
);

CREATE INDEX idx_klinks_source ON knowledge_links(source_document_id);
CREATE INDEX idx_klinks_target ON knowledge_links(target_document_id);

-- ---------------------------------------------------------------------------
-- document_versions  (immutable version history)
-- ---------------------------------------------------------------------------
CREATE TABLE document_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  title       TEXT NOT NULL,
  changed_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  change_note TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);

CREATE INDEX idx_dver_document ON document_versions(document_id);

-- ---------------------------------------------------------------------------
-- document_permissions  (fine-grained per-document access control)
-- ---------------------------------------------------------------------------
CREATE TABLE document_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL DEFAULT 'read',
  -- read | edit | admin
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_permissions_user_or_role CHECK (
    (user_id IS NOT NULL AND role_id IS NULL) OR
    (user_id IS NULL AND role_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_dperm_user ON document_permissions(document_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_dperm_role ON document_permissions(document_id, role_id)
  WHERE role_id IS NOT NULL;
CREATE INDEX idx_dperm_workspace ON document_permissions(workspace_id);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE knowledge_collections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions     ENABLE ROW LEVEL SECURITY;

-- knowledge_collections
CREATE POLICY kc_select ON knowledge_collections FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY kc_insert ON knowledge_collections FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY kc_update ON knowledge_collections FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY kc_delete ON knowledge_collections FOR DELETE
  USING (is_workspace_member(workspace_id));

-- knowledge_sources
CREATE POLICY ks_select ON knowledge_sources FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY ks_insert ON knowledge_sources FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY ks_update ON knowledge_sources FOR UPDATE
  USING (is_workspace_member(workspace_id));

-- knowledge_documents
CREATE POLICY kd_select ON knowledge_documents FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY kd_insert ON knowledge_documents FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY kd_update ON knowledge_documents FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY kd_delete ON knowledge_documents FOR DELETE
  USING (is_workspace_member(workspace_id));

-- knowledge_chunks (inherit from parent document's workspace)
CREATE POLICY kchunk_select ON knowledge_chunks FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY kchunk_insert ON knowledge_chunks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY kchunk_delete ON knowledge_chunks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- knowledge_tags
CREATE POLICY ktag_select ON knowledge_tags FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY ktag_insert ON knowledge_tags FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY ktag_update ON knowledge_tags FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY ktag_delete ON knowledge_tags FOR DELETE
  USING (is_workspace_member(workspace_id));

-- document_tags (via document's workspace membership)
CREATE POLICY dtag_select ON document_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_tags.document_id
        AND is_workspace_member(kd.workspace_id)
    )
  );
CREATE POLICY dtag_insert ON document_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_tags.document_id
        AND is_workspace_member(kd.workspace_id)
    )
  );
CREATE POLICY dtag_delete ON document_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_tags.document_id
        AND is_workspace_member(kd.workspace_id)
    )
  );

-- knowledge_links
CREATE POLICY klinks_select ON knowledge_links FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY klinks_insert ON knowledge_links FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY klinks_delete ON knowledge_links FOR DELETE
  USING (is_workspace_member(workspace_id));

-- document_versions
CREATE POLICY dver_select ON document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_versions.document_id
        AND is_workspace_member(kd.workspace_id)
    )
  );
CREATE POLICY dver_insert ON document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = document_versions.document_id
        AND is_workspace_member(kd.workspace_id)
    )
  );

-- document_permissions (admins only; simplified to workspace membership for now)
CREATE POLICY dperm_select ON document_permissions FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY dperm_insert ON document_permissions FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY dperm_delete ON document_permissions FOR DELETE
  USING (is_workspace_member(workspace_id));
