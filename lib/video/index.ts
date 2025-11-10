/**
 * Video Processing Module
 *
 * Exports all video processing utilities, state machine, analytics, and real-time features
 */

// State Machine
export {
  // State management
  updateVideoStatus,
  transitionToNextStage,
  markVideoAsFailed,
  retryFailedVideo,

  // State validation
  isValidTransition,
  getNextStates,
  getStageMetadata,
  isTerminalState,
  isRetryableState,

  // Batch operations
  getVideosByStatus,
  getProcessingStats,
  getStuckVideos,

  // Helper functions
  calculateProgress,
  getEstimatedTimeRemaining,
  getProcessingDuration,

  // Errors
  ProcessingError,
  StateTransitionError,
} from './processor';

// Real-time Subscriptions
export {
  VideoProcessingSubscription,
  useVideoProcessingSubscription,
  broadcastProcessingUpdate,
  broadcastStatsUpdate,
  createResilientSubscription,
  type VideoUpdateEvent,
  type ProcessingStatsEvent,
  type VideoUpdateCallback,
  type StatsUpdateCallback,
  type ErrorCallback,
} from './realtime';

// Analytics
export {
  ProcessingTimer,
  logProcessingCompletion,
  logProcessingFailure,
  identifyBottleneck,
  calculateAverageProcessingTimes,
  checkForPerformanceAlerts,
  sendPerformanceAlert,
  getProcessingStatistics,
  exportProcessingAnalytics,
  type StageTimings,
  type ProcessingMetrics,
  type PerformanceAlert,
} from './analytics';

// Chunking
export {
  chunkTranscript,
  validateChunks,
  getChunkingStats,
  type TranscriptChunk,
  type ChunkingOptions,
} from './chunking';

// Embeddings
export {
  generateEmbeddings,
  generateQueryEmbedding,
  validateEmbedding,
  estimateEmbeddingCost,
  batchEmbeddingsWithRateLimit,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  type EmbeddingOptions,
} from './embeddings';

// Vector Search
export {
  searchVideoChunks,
  searchWithinVideo,
  searchAcrossVideos,
  findRelatedChunks,
  buildVideoUrlWithTimestamp,
  formatResultForRAG,
  buildRAGContext,
  getSearchStats,
  testVectorSearch,
  type VectorSearchResult,
  type VectorSearchOptions,
} from './vector-search';
