-- Additive migration. Apply manually to an existing database; no existing chat data is removed.
BEGIN;
CREATE TABLE IF NOT EXISTS chat_presence (
  admin_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'bot' CHECK(status IN ('bot','waiting','active','ended')),
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  disconnected_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK(sender IN ('user','bot','admin','system')),
  text TEXT NOT NULL,
  pending BOOLEAN NOT NULL DEFAULT false,
  request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, request_id)
);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_id,id);
CREATE TABLE IF NOT EXISTS chat_reads (
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  last_message_id BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY(admin_id,conversation_id)
);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='codex_user') THEN
    GRANT SELECT,INSERT,UPDATE,DELETE ON chat_presence,chat_conversations,chat_messages,chat_reads TO codex_user;
    GRANT USAGE,SELECT ON SEQUENCE chat_messages_id_seq TO codex_user;
  END IF;
END $$;
COMMIT;
