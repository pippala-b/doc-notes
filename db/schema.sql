-- doc-notes schema. Applied idempotently on first server request (src/lib/db.ts)
-- and via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS notes (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_kind  TEXT NOT NULL CHECK (source_kind IN ('photo', 'link', 'text', 'mixed')),
  source_text  TEXT,
  source_url   TEXT,
  topic_id     TEXT NOT NULL,
  enhanced     JSONB NOT NULL,
  reviewed_at  TIMESTAMPTZ,
  confidence   SMALLINT CHECK (confidence BETWEEN 1 AND 3)
);

CREATE INDEX IF NOT EXISTS notes_topic_idx ON notes (topic_id);
CREATE INDEX IF NOT EXISTS notes_created_idx ON notes (created_at DESC);

CREATE TABLE IF NOT EXISTS note_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     BIGINT NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  media_type  TEXT NOT NULL,
  data        BYTEA NOT NULL,
  pins        JSONB NOT NULL DEFAULT '[]'  -- [{id, x, y, text}] with x,y in 0..1
);

CREATE INDEX IF NOT EXISTS note_images_note_idx ON note_images (note_id, position);
