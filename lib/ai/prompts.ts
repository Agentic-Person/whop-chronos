/**
 * AI Prompt Templates
 *
 * System prompts and templates for Claude AI educational assistant.
 * Defines persona, behavior, and citation formatting.
 */

import type { VectorSearchResult } from '@/lib/video/vector-search';

export interface PromptContext {
  studentName?: string;
  courseTitle?: string;
  videoContext?: VectorSearchResult[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Main system prompt for educational assistant persona
 */
export function getSystemPrompt(context?: PromptContext): string {
  const basePrompt = `You are Chronos, an AI teaching assistant helping students learn from video courses.

Your role:
- Help students understand course content through conversation
- Answer questions using information from video transcripts
- Provide clear explanations and examples
- Encourage deeper thinking with follow-up questions
- Guide students to the right video sections for more detail

Key behaviors:
- Always cite video sources with timestamps when referencing content
- Be encouraging and supportive
- Ask clarifying questions when needed
- Break down complex concepts into simple terms
- Suggest related topics or videos when relevant
- If you don't know something, say so - don't make up information

Citation format:
- Use this format: [Video Title @ MM:SS]
- Example: "As explained in [Introduction to Trading @ 3:45]..."
- Always include the timestamp so students can jump to that section

Teaching style:
- Use analogies and real-world examples
- Check for understanding with questions
- Celebrate progress and learning moments
- Be patient and never condescending
- Adapt explanations based on student responses`;

  if (context?.studentName) {
    return `${basePrompt}\n\nYou're currently helping ${context.studentName}.`;
  }

  return basePrompt;
}

/**
 * Build context section with video search results
 */
export function buildContextSection(
  results: VectorSearchResult[],
  maxChunks = 5
): string {
  if (!results || results.length === 0) {
    return "No relevant video content found for this query. I can only help with questions about the available course videos.";
  }

  const topResults = results.slice(0, maxChunks);

  const contextParts = topResults.map((result, index) => {
    const timestamp = formatTimestamp(result.start_time_seconds);
    const title = result.video_title || 'Unknown Video';

    return `Source ${index + 1}: ${title} @ ${timestamp}
Similarity: ${(result.similarity * 100).toFixed(1)}%
Content: ${result.chunk_text.trim()}`;
  });

  return `Here are relevant sections from the course videos:

${contextParts.join('\n\n---\n\n')}

Use this information to answer the student's question. Always cite sources with timestamps.`;
}

/**
 * Format timestamp (MM:SS or HH:MM:SS)
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Build complete prompt with context and query
 */
export function buildPrompt(
  query: string,
  searchResults: VectorSearchResult[],
  context?: PromptContext
): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = getSystemPrompt(context);
  const contextSection = buildContextSection(searchResults);

  const userPrompt = `${contextSection}

Student's Question: ${query}

Please provide a helpful, accurate answer based on the video content above. Remember to cite sources with timestamps.`;

  return {
    systemPrompt,
    userPrompt,
  };
}

/**
 * Prompt for generating follow-up questions
 */
export function getFollowUpQuestionsPrompt(
  conversation: Array<{ role: string; content: string }>,
  maxQuestions = 3
): string {
  return `Based on this conversation, suggest ${maxQuestions} thoughtful follow-up questions the student might ask to deepen their understanding.

Requirements:
- Questions should build on what was just discussed
- Each question should explore a different aspect or go deeper
- Make them specific and actionable
- Don't repeat what was already asked

Format your response as a JSON array of strings:
["Question 1", "Question 2", "Question 3"]`;
}

/**
 * Prompt for quiz/test questions
 */
export function getQuizGenerationPrompt(
  videoChunks: VectorSearchResult[],
  questionCount = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): string {
  const contextSection = buildContextSection(videoChunks);

  return `${contextSection}

Generate ${questionCount} ${difficulty} multiple-choice questions to test understanding of this content.

For each question:
1. Write a clear question
2. Provide 4 answer options (A, B, C, D)
3. Mark the correct answer
4. Include a brief explanation
5. Cite the video timestamp where this is covered

Format as JSON array with this structure:
[
  {
    "question": "What is...",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "correctAnswer": "B",
    "explanation": "...",
    "videoReference": {
      "title": "Video Title",
      "timestamp": 180
    }
  }
]`;
}

/**
 * Prompt for concept explanation
 */
export function getConceptExplanationPrompt(
  concept: string,
  searchResults: VectorSearchResult[]
): string {
  const contextSection = buildContextSection(searchResults);

  return `${contextSection}

Explain the concept of "${concept}" based on the video content above.

Your explanation should:
- Start with a simple definition
- Use examples from the videos
- Break down any complex parts
- Provide practical context
- Cite video sources with timestamps
- End with a summary or key takeaway

Make it clear and engaging for someone learning this for the first time.`;
}

/**
 * Prompt for timestamp-specific questions
 */
export function getTimestampQuestionPrompt(
  videoTitle: string,
  timestamp: number,
  videoChunk: string,
  question: string
): string {
  const formattedTime = formatTimestamp(timestamp);

  return `The student is watching "${videoTitle}" at timestamp ${formattedTime} and has a question about this specific section:

Video Content (at ${formattedTime}):
${videoChunk}

Student's Question:
${question}

Answer their question directly in the context of what's happening at this point in the video. Be specific to this moment in the lesson.`;
}

/**
 * Prompt for summarizing video content
 */
export function getSummaryPrompt(
  videoTitle: string,
  chunks: VectorSearchResult[]
): string {
  const contextSection = buildContextSection(chunks, 10);

  return `${contextSection}

Create a comprehensive summary of the video "${videoTitle}" based on these segments.

Your summary should include:
1. Main Topic: What is the video about?
2. Key Concepts: List 3-5 main concepts covered
3. Important Timestamps: Highlight critical sections with times
4. Prerequisites: What should students know beforehand?
5. Next Steps: What should they learn next?

Keep it concise but informative - around 200-300 words.`;
}

/**
 * Error/fallback prompts
 */
export const FALLBACK_PROMPTS = {
  noContext: `I don't have access to video content that directly answers your question. Could you:
- Rephrase your question more specifically?
- Let me know which video you're referring to?
- Ask about a topic that was covered in the course videos?

I can only help with questions about the course content that's been uploaded.`,

  technicalError: `I encountered a technical issue processing your request. Please try again, and if the problem persists, let your instructor know.`,

  rateLimitExceeded: `You've reached the message limit for now. This helps ensure fair usage for all students. Try again in a few minutes, or review the video content while you wait.`,

  emptyQuery: `I'm here to help! What would you like to know about the course content?`,
};

/**
 * Extract video references from assistant response
 */
export function extractVideoReferences(
  response: string,
  searchResults: VectorSearchResult[]
): Array<{
  video_id: string;
  video_title: string;
  timestamp: number;
  snippet: string;
}> {
  const references: Array<{
    video_id: string;
    video_title: string;
    timestamp: number;
    snippet: string;
  }> = [];

  // Match patterns like [Video Title @ MM:SS] or [Video Title @ HH:MM:SS]
  const citationRegex = /\[([^\]@]+)@\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(response)) !== null) {
    const title = match[1].trim();
    const minutes = Number.parseInt(match[2]);
    const seconds = Number.parseInt(match[3]);
    const hours = match[4] ? Number.parseInt(match[4]) : 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Find matching video from search results
    const matchingResult = searchResults.find(
      r => r.video_title?.toLowerCase().includes(title.toLowerCase())
    );

    if (matchingResult) {
      references.push({
        video_id: matchingResult.video_id,
        video_title: matchingResult.video_title || title,
        timestamp: totalSeconds,
        snippet: matchingResult.chunk_text.slice(0, 200),
      });
    }
  }

  return references;
}
