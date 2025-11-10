// Chat analytics calculation library

import type {
  ChatMessage,
  QualityMetrics,
  QuestionCluster,
  CostBreakdown,
  Session,
} from '@/components/analytics/chat-types';

/**
 * Calculate AI response quality metrics from chat messages
 */
export function calculateResponseQuality(
  messages: ChatMessage[]
): QualityMetrics {
  const aiMessages = messages.filter((m) => m.role === 'assistant');

  if (aiMessages.length === 0) {
    return {
      avgLength: 0,
      citationRate: 0,
      followUpRate: 0,
    };
  }

  // Calculate average response length in words
  const avgLength =
    aiMessages.reduce(
      (sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length,
      0
    ) / aiMessages.length;

  // Calculate citation rate (% of responses with video references)
  const citationRate =
    aiMessages.filter((m) => hasVideoReference(m)).length / aiMessages.length;

  // Calculate follow-up rate (% of AI responses followed by user question)
  let followUpCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (
      messages[i].role === 'assistant' &&
      messages[i + 1].role === 'user'
    ) {
      followUpCount++;
    }
  }
  const followUpRate = aiMessages.length > 0 ? followUpCount / aiMessages.length : 0;

  return {
    avgLength: Math.round(avgLength),
    citationRate: Math.round(citationRate * 100) / 100,
    followUpRate: Math.round(followUpRate * 100) / 100,
  };
}

/**
 * Check if a message contains video references
 */
export function hasVideoReference(message: ChatMessage): boolean {
  if (message.has_video_reference !== undefined) {
    return message.has_video_reference;
  }

  // Fallback: Check for common citation patterns
  const citationPatterns = [
    /\[Video:/i,
    /\[Timestamp:/i,
    /\[@\d+:\d+\]/,
    /video_id:/i,
  ];

  return citationPatterns.some((pattern) => pattern.test(message.content));
}

/**
 * Cluster similar questions using basic string similarity
 * For MVP: Simple keyword and structure matching
 * Future: Use embeddings for semantic clustering
 */
export function clusterSimilarQuestions(
  questions: string[]
): QuestionCluster[] {
  const clusters: QuestionCluster[] = [];
  const processed = new Set<number>();

  questions.forEach((q1, i) => {
    if (processed.has(i)) return;

    const cluster: QuestionCluster = {
      representative: q1,
      variations: [q1],
      count: 1,
      avgResponseTime: 0,
      referencedVideos: [],
    };

    // Find similar questions
    questions.forEach((q2, j) => {
      if (i === j || processed.has(j)) return;

      if (areQuestionsSimilar(q1, q2)) {
        cluster.variations.push(q2);
        cluster.count++;
        processed.add(j);
      }
    });

    clusters.push(cluster);
    processed.add(i);
  });

  // Sort by frequency
  return clusters.sort((a, b) => b.count - a.count);
}

/**
 * Check if two questions are similar using basic heuristics
 */
function areQuestionsSimilar(q1: string, q2: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[?!.,]/g, '')
      .trim();

  const n1 = normalize(q1);
  const n2 = normalize(q2);

  // Exact match
  if (n1 === n2) return true;

  // Levenshtein distance threshold
  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= 0.7; // 70% similarity threshold
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate AI API cost from chat messages
 */
export function calculateAICost(messages: ChatMessage[]): CostBreakdown {
  // Pricing per million tokens (USD)
  const costs = {
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    haiku: { input: 0.8, output: 4.0 },
    sonnet: { input: 3.0, output: 15.0 },
  };

  const breakdown: CostBreakdown = {
    total: 0,
    byModel: {},
    byDate: [],
    perMessage: 0,
    perStudent: 0,
  };

  const dateMap = new Map<string, number>();

  messages.forEach((msg) => {
    // Use stored cost if available
    if (msg.cost_usd) {
      breakdown.total += msg.cost_usd;
      const model = msg.model || 'haiku';
      breakdown.byModel[model] = (breakdown.byModel[model] || 0) + msg.cost_usd;

      // Track by date
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + msg.cost_usd);
    } else if (msg.input_tokens && msg.output_tokens) {
      // Calculate cost
      const model = msg.model || 'haiku';
      const pricing = costs[model as keyof typeof costs] || costs.haiku;
      const cost =
        (msg.input_tokens * pricing.input +
          msg.output_tokens * pricing.output) /
        1_000_000;

      breakdown.total += cost;
      breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost;

      // Track by date
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + cost);
    }
  });

  // Convert date map to array
  breakdown.byDate = Array.from(dateMap.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate per-message cost
  breakdown.perMessage = messages.length > 0 ? breakdown.total / messages.length : 0;

  // Calculate per-student cost
  const uniqueStudents = new Set(messages.map((m) => m.student_id)).size;
  breakdown.perStudent = uniqueStudents > 0 ? breakdown.total / uniqueStudents : 0;

  return breakdown;
}

/**
 * Detect session boundaries in chat messages
 * Sessions are separated by 30 minutes of inactivity
 */
export function detectSessionBoundaries(
  messages: ChatMessage[]
): Session[] {
  if (messages.length === 0) return [];

  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const sessions: Session[] = [];
  let currentSession: ChatMessage[] = [sortedMessages[0]];
  let sessionStart = new Date(sortedMessages[0].created_at);

  for (let i = 1; i < sortedMessages.length; i++) {
    const msg = sortedMessages[i];
    const prevMsg = sortedMessages[i - 1];
    const timeDiff =
      new Date(msg.created_at).getTime() -
      new Date(prevMsg.created_at).getTime();

    if (timeDiff > SESSION_TIMEOUT_MS) {
      // End current session
      const sessionEnd = new Date(prevMsg.created_at);
      sessions.push(createSession(currentSession, sessionStart, sessionEnd));

      // Start new session
      currentSession = [msg];
      sessionStart = new Date(msg.created_at);
    } else {
      currentSession.push(msg);
    }
  }

  // Add final session
  if (currentSession.length > 0) {
    const sessionEnd = new Date(currentSession[currentSession.length - 1].created_at);
    sessions.push(createSession(currentSession, sessionStart, sessionEnd));
  }

  return sessions;
}

/**
 * Create a session object from messages
 */
function createSession(
  messages: ChatMessage[],
  startTime: Date,
  endTime: Date
): Session {
  const duration = endTime.getTime() - startTime.getTime();

  // Session is "completed" if the last message is from assistant
  const completed = messages[messages.length - 1].role === 'assistant';

  return {
    id: `session-${startTime.getTime()}`,
    messages,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration,
    messageCount: messages.length,
    completed,
  };
}

/**
 * Extract video references from AI messages
 */
export function extractVideoReferences(message: ChatMessage): string[] {
  if (message.video_references && message.video_references.length > 0) {
    return message.video_references;
  }

  // Parse video references from message content
  const videoIdPattern = /video[_-]id:\s*([a-zA-Z0-9-]+)/gi;
  const matches = message.content.matchAll(videoIdPattern);
  const videoIds = Array.from(matches, (m) => m[1]);

  return [...new Set(videoIds)]; // Remove duplicates
}

/**
 * Calculate trend direction and percentage
 */
export function calculateTrend(
  current: number,
  previous: number
): { trend: 'up' | 'down' | 'stable'; percentage: number } {
  if (previous === 0) {
    return { trend: 'stable', percentage: 0 };
  }

  const change = ((current - previous) / previous) * 100;
  const threshold = 5; // 5% threshold for "stable"

  if (Math.abs(change) < threshold) {
    return { trend: 'stable', percentage: change };
  }

  return {
    trend: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
}
