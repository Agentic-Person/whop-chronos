/**
 * AI Module Exports
 *
 * Central export for all AI-related functionality:
 * - Claude API integration
 * - Prompt templates
 * - Cost tracking
 * - Rate limiting
 * - Caching
 * - Streaming utilities
 */

// Claude API
export {
  generateChatCompletion,
  generateStreamingCompletion,
  generateRAGResponse,
  generateStreamingRAGResponse,
  testClaudeAPI,
  validateAPIKey,
  getModelInfo,
  type ChatMessage,
  type ChatCompletionOptions,
  type ChatCompletionResult,
  type StreamChunk,
} from './claude';

// Configuration
export {
  getCurrentModel,
  calculateCost,
  getModelById,
  listAvailableModels,
  AI_MODELS,
  type AIModelConfig,
} from './config';

// Prompts
export {
  getSystemPrompt,
  buildContextSection,
  buildPrompt,
  getFollowUpQuestionsPrompt,
  getQuizGenerationPrompt,
  getConceptExplanationPrompt,
  getTimestampQuestionPrompt,
  getSummaryPrompt,
  extractVideoReferences,
  FALLBACK_PROMPTS,
  type PromptContext,
} from './prompts';

// Cost tracking
export {
  trackMessageCost,
  getMonthlyUsage,
  checkTierLimits,
  getCostTrend,
  getTopSpenders,
  estimateMonthlyUsage,
  resetMonthlyUsage,
  TIER_LIMITS,
  type CostEntry,
  type MonthlyUsage,
  type TierLimits,
} from './cost-tracker';

// Rate limiting
export {
  checkRateLimit,
  getRateLimitStatus,
  resetStudentRateLimit,
  resetCreatorRateLimit,
  getRateLimitAnalytics,
  formatRateLimitError,
  isRateLimitingEnabled,
  type RateLimitResult,
  type RateLimitCheck,
} from './rate-limit';

// Caching
export {
  getCachedResponse,
  cacheResponse,
  invalidateVideoCache,
  invalidateAllCache,
  getCacheStats,
  resetCacheStats,
  getCacheInfo,
  warmCache,
  type CachedResponse,
  type CacheStats,
} from './cache';

// Streaming
export {
  formatSSEMessage,
  createSSEHeaders,
  createStreamingResponse,
  createSSEStream,
  createHeartbeatStream,
  mergeStreams,
  timeoutStream,
  retryStream,
  createSSEClient,
  SSE_EVENTS,
  SSEEncoder,
  SSEParser,
  SSEReconnector,
  type SSEClientOptions,
} from './streaming';
