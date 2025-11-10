-- Create vector similarity search index
-- Migration 3: Vector search optimization

-- =====================================================
-- VECTOR SIMILARITY INDEX
-- =====================================================

-- Create IVFFlat index for approximate nearest neighbor search
-- Using cosine distance for semantic similarity
-- Lists parameter set to sqrt(total_rows) for optimal performance
-- Start with 100 lists (good for up to 10,000 vectors)
CREATE INDEX IF NOT EXISTS idx_video_chunks_embedding_cosine
ON video_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON INDEX idx_video_chunks_embedding_cosine IS 'IVFFlat index for fast vector similarity search using cosine distance';

-- =====================================================
-- HELPER FUNCTIONS FOR VECTOR SEARCH
-- =====================================================

-- Function to search video chunks by semantic similarity
CREATE OR REPLACE FUNCTION search_video_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.7,
  filter_video_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  video_id UUID,
  chunk_text TEXT,
  start_time_seconds INT,
  end_time_seconds INT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vc.id AS chunk_id,
    vc.video_id,
    vc.chunk_text,
    vc.start_time_seconds,
    vc.end_time_seconds,
    1 - (vc.embedding <=> query_embedding) AS similarity
  FROM video_chunks vc
  WHERE
    vc.embedding IS NOT NULL
    AND (filter_video_ids IS NULL OR vc.video_id = ANY(filter_video_ids))
    AND 1 - (vc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY vc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_video_chunks IS 'Semantic search across video chunks with optional video filtering';

-- =====================================================
-- STATISTICS AND MONITORING
-- =====================================================

-- View to monitor vector index health
CREATE OR REPLACE VIEW vector_index_stats AS
SELECT
  COUNT(*) as total_chunks,
  COUNT(embedding) as chunks_with_embeddings,
  COUNT(*) - COUNT(embedding) as chunks_without_embeddings,
  ROUND(100.0 * COUNT(embedding) / NULLIF(COUNT(*), 0), 2) as embedding_coverage_percent
FROM video_chunks;

COMMENT ON VIEW vector_index_stats IS 'Monitor vector embedding coverage';

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze table for query planner optimization
ANALYZE video_chunks;

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE video_chunks;
