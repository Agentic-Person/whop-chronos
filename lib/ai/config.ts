/**
 * AI Model Configuration
 *
 * Centralized configuration for Claude models and pricing.
 * Switch models via ANTHROPIC_MODEL environment variable.
 */

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  inputCostPer1M: number; // USD per 1M tokens
  outputCostPer1M: number; // USD per 1M tokens
  maxTokens: number;
  contextWindow: number;
  supportStreaming: boolean;
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fastest, most cost-effective. Best for high-volume chat.',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxTokens: 8192,
    contextWindow: 200000,
    supportStreaming: true,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Balanced intelligence, speed, and cost.',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    maxTokens: 8192,
    contextWindow: 200000,
    supportStreaming: true,
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most intelligent for complex reasoning.',
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    maxTokens: 4096,
    contextWindow: 200000,
    supportStreaming: true,
  },
};

// Get current model from environment variable
export function getCurrentModel(): AIModelConfig {
  const modelId = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
  const model = AI_MODELS[modelId];

  if (!model) {
    console.warn(
      `Unknown model "${modelId}", falling back to Claude 3.5 Haiku`
    );
    return AI_MODELS['claude-3-5-haiku-20241022'];
  }

  return model;
}

// Calculate cost for a message
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelId?: string
): number {
  const model = modelId ? AI_MODELS[modelId] : getCurrentModel();

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;

  return inputCost + outputCost;
}

// Get model by ID
export function getModelById(modelId: string): AIModelConfig | null {
  return AI_MODELS[modelId] || null;
}

// List all available models
export function listAvailableModels(): AIModelConfig[] {
  return Object.values(AI_MODELS);
}
