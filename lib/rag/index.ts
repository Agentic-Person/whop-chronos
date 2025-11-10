/**
 * RAG Engine - Vector Search and Context Building for AI Chat
 *
 * Main exports for the RAG (Retrieval-Augmented Generation) system.
 */

// Search functionality
export {
  enhancedSearch,
  searchWithinCourse,
  searchCreatorContent,
  invalidateCacheForVideo,
  invalidateAllSearchCache,
  getSearchMetrics,
  type EnhancedSearchOptions,
  type EnhancedSearchResult,
} from './search';

// Ranking algorithms
export {
  rankSearchResults,
  boostVideoInResults,
  filterByRankScore,
  ensureResultDiversity,
  type RankingOptions,
} from './ranking';

// Context building for LLMs
export {
  buildContext,
  buildCitation,
  buildSystemPrompt,
  buildConversationPrompt,
  extractCitations,
  optimizeContextForUseCase,
  getContextStats,
  type ContextBuilderOptions,
  type FormattedContext,
  type VideoSource,
  type ConversationContext,
} from './context-builder';

// Session management
export {
  createSession,
  getSession,
  getOrCreateSession,
  updateSession,
  updateSessionTitle,
  generateAndSetTitle,
  touchSession,
  archiveSession,
  deleteSession,
  listSessions,
  searchSessions,
  getSessionCount,
} from './sessions';

// Message management
export {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  getMessageCount,
  searchMessages,
  exportSessionAsJSON,
  exportSessionAsMarkdown,
  getConversationHistory,
  getMessagesWithVideoRefs,
  countMessagesByRole,
  type ConversationMessage,
} from './messages';

// Analytics
export {
  getSessionAnalytics,
  getCreatorChatAnalytics,
  trackChatUsage,
  getChatUsageMetrics,
} from './analytics';

// Cost calculation
export {
  calculateChatCost,
  calculateEmbeddingCost,
  calculateCompleteCost,
  estimateSessionCost,
  projectMonthlyCost,
  getCostOptimizationSuggestions,
  formatCost,
  calculateStudentCost,
  getPricingInfo,
  type MonthlyCostProjection,
  type CostOptimizationSuggestion,
  type StudentCostSummary,
} from './cost-calculator';

// Title generation
export {
  generateSessionTitle,
  clearTitleCache,
  getTitleCacheStats,
} from './title-generator';

// Types
export type {
  ChatSession,
  ChatSessionInsert,
  ChatSessionUpdate,
  ChatMessage,
  ChatMessageInsert,
  ChatMessageUpdate,
  VideoReference,
  SessionWithMessages,
  SessionListItem,
  SessionAnalytics,
  CreatorChatAnalytics,
  ChatUsageMetrics,
  CostBreakdown,
  CostCalculatorOptions,
  SessionExport,
  SessionFilters,
  PaginationOptions,
  PaginatedResponse,
  ExportFormat,
} from './types';

/**
 * Quick start example:
 *
 * ```typescript
 * import { enhancedSearch, buildContext, buildSystemPrompt } from '@/lib/rag';
 *
 * // 1. Search for relevant content
 * const results = await enhancedSearch('How do I set up authentication?', {
 *   match_count: 5,
 *   boost_viewed_by_student: studentId,
 * });
 *
 * // 2. Build context for LLM
 * const context = buildContext(results, {
 *   max_tokens: 8000,
 *   format: 'markdown',
 * });
 *
 * // 3. Create system prompt
 * const systemPrompt = buildSystemPrompt(context);
 *
 * // 4. Send to Claude API
 * const response = await anthropic.messages.create({
 *   model: 'claude-3-5-sonnet-20241022',
 *   max_tokens: 2048,
 *   system: systemPrompt,
 *   messages: [{ role: 'user', content: userQuestion }],
 * });
 * ```
 */
