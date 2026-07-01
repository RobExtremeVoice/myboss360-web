-- =============================================================================
-- MyBoss360 — Sprint 20B: Gmail Intelligence Engine (Parts 3 & 4)
-- Migration: 20260701000004_gmail_threads_schema.sql
-- =============================================================================
-- Tables created here:
--   gmail_threads            — one row per Gmail thread (intelligence metadata)
--   gmail_messages           — one row per Gmail message (normalized)
--   gmail_contacts           — contacts extracted from email headers
--   gmail_thread_participants — join between threads and extracted contacts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- gmail_threads — normalized thread with intelligence metadata
-- ---------------------------------------------------------------------------
-- status values:
--   open               — thread exists, status not yet classified
--   waiting_for_us     — last message is from external sender (they await reply)
--   waiting_for_customer — last message is from the executive (we await reply)
--   closed             — thread is trashed, spammed, or has no activity for 30d
-- ---------------------------------------------------------------------------
CREATE TABLE gmail_threads (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id             UUID        NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  workspace_id              UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  thread_id                 TEXT        NOT NULL,
  subject                   TEXT,
  snippet                   TEXT,
  label_ids                 TEXT[]      NOT NULL DEFAULT '{}',
  status                    TEXT        NOT NULL DEFAULT 'open',
  message_count             INTEGER     NOT NULL DEFAULT 0,
  first_message_at          TIMESTAMPTZ,
  latest_reply_at           TIMESTAMPTZ,
  last_sender_email         TEXT,
  participant_emails        TEXT[]      NOT NULL DEFAULT '{}',
  avg_response_latency_ms   BIGINT,
  last_response_latency_ms  BIGINT,
  last_synced_at            TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, thread_id)
);

CREATE TRIGGER gmail_threads_updated_at
  BEFORE UPDATE ON gmail_threads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gthr_connection   ON gmail_threads(connection_id);
CREATE INDEX idx_gthr_workspace    ON gmail_threads(workspace_id);
CREATE INDEX idx_gthr_status       ON gmail_threads(workspace_id, status);
CREATE INDEX idx_gthr_latest_reply ON gmail_threads(workspace_id, latest_reply_at DESC);
CREATE INDEX idx_gthr_thread_id    ON gmail_threads(connection_id, thread_id);

ALTER TABLE gmail_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail thread owner can select"
  ON gmail_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail thread owner can insert"
  ON gmail_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail thread owner can update"
  ON gmail_threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail thread owner can delete"
  ON gmail_threads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- gmail_messages — individual messages inside a thread
-- ---------------------------------------------------------------------------
CREATE TABLE gmail_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID        NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  gmail_thread_id UUID        NOT NULL REFERENCES gmail_threads(id) ON DELETE CASCADE,
  message_id      TEXT        NOT NULL,
  google_thread_id TEXT       NOT NULL,
  from_email      TEXT        NOT NULL,
  from_name       TEXT,
  to_emails       TEXT[]      NOT NULL DEFAULT '{}',
  cc_emails       TEXT[]      NOT NULL DEFAULT '{}',
  subject         TEXT,
  snippet         TEXT,
  body_text       TEXT,
  label_ids       TEXT[]      NOT NULL DEFAULT '{}',
  sent_at         TIMESTAMPTZ NOT NULL,
  is_outbound     BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, message_id)
);

CREATE TRIGGER gmail_messages_updated_at
  BEFORE UPDATE ON gmail_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gmsg_thread     ON gmail_messages(gmail_thread_id);
CREATE INDEX idx_gmsg_connection ON gmail_messages(connection_id);
CREATE INDEX idx_gmsg_sent_at    ON gmail_messages(gmail_thread_id, sent_at ASC);
CREATE INDEX idx_gmsg_from_email ON gmail_messages(workspace_id, from_email);

ALTER TABLE gmail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail message owner can select"
  ON gmail_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail message owner can insert"
  ON gmail_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail message owner can update"
  ON gmail_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail message owner can delete"
  ON gmail_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- gmail_contacts — contacts extracted from email headers (Part 4)
-- ---------------------------------------------------------------------------
-- crm_contact_id is populated when a CRM contact with the same email is found.
-- Null means no CRM match yet — these are candidates for contact creation.
-- ---------------------------------------------------------------------------
CREATE TABLE gmail_contacts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID        NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  display_name    TEXT,
  domain          TEXT        NOT NULL,
  organization    TEXT,
  signature_hint  TEXT,
  crm_contact_id  UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count   INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, email)
);

CREATE TRIGGER gmail_contacts_updated_at
  BEFORE UPDATE ON gmail_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gcon_connection ON gmail_contacts(connection_id);
CREATE INDEX idx_gcon_workspace  ON gmail_contacts(workspace_id);
CREATE INDEX idx_gcon_email      ON gmail_contacts(workspace_id, email);
CREATE INDEX idx_gcon_domain     ON gmail_contacts(workspace_id, domain);
CREATE INDEX idx_gcon_crm        ON gmail_contacts(crm_contact_id) WHERE crm_contact_id IS NOT NULL;

ALTER TABLE gmail_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail contact owner can select"
  ON gmail_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail contact owner can insert"
  ON gmail_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail contact owner can update"
  ON gmail_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail contact owner can delete"
  ON gmail_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_connections gc
      WHERE gc.id = connection_id AND gc.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- gmail_thread_participants — join between threads and extracted contacts
-- ---------------------------------------------------------------------------
-- role values: 'sender' | 'recipient' | 'cc'
-- A contact can appear in multiple roles across different messages;
-- the dominant role is stored (sender > recipient > cc).
-- ---------------------------------------------------------------------------
CREATE TABLE gmail_thread_participants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_thread_id  UUID        NOT NULL REFERENCES gmail_threads(id) ON DELETE CASCADE,
  gmail_contact_id UUID        NOT NULL REFERENCES gmail_contacts(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL DEFAULT 'recipient',
  message_count    INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gmail_thread_id, gmail_contact_id)
);

CREATE TRIGGER gmail_thread_participants_updated_at
  BEFORE UPDATE ON gmail_thread_participants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gtp_thread  ON gmail_thread_participants(gmail_thread_id);
CREATE INDEX idx_gtp_contact ON gmail_thread_participants(gmail_contact_id);

ALTER TABLE gmail_thread_participants ENABLE ROW LEVEL SECURITY;

-- Participants are readable/writable if the user owns the parent thread's connection.
CREATE POLICY "gmail participant owner can select"
  ON gmail_thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gmail_threads gt
        JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail participant owner can insert"
  ON gmail_thread_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gmail_threads gt
        JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail participant owner can update"
  ON gmail_thread_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gmail_threads gt
        JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id AND gc.user_id = auth.uid()
    )
  );

CREATE POLICY "gmail participant owner can delete"
  ON gmail_thread_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gmail_threads gt
        JOIN google_connections gc ON gc.id = gt.connection_id
      WHERE gt.id = gmail_thread_id AND gc.user_id = auth.uid()
    )
  );
