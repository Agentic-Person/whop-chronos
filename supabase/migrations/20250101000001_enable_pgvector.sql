-- Enable pgvector extension for vector embeddings
-- This must be the first migration

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension not available';
  END IF;
END
$$;

COMMENT ON EXTENSION vector IS 'Vector similarity search for AI embeddings';
