export type AIErrorKind =
  | 'authentication'
  | 'rate_limit'
  | 'network'
  | 'timeout'
  | 'model_unavailable'
  | 'unsupported_feature'
  | 'abort'
  | 'unknown';

export interface NormalizedAIError {
  kind: AIErrorKind;
  message: string;
  provider?: 'google' | 'openrouter';
  modelId?: string;
  statusCode?: number;
  retryable: boolean;
}

export function normalizeAIError(error: unknown, provider?: 'google' | 'openrouter', modelId?: string): NormalizedAIError {
  if (!error) {
    return {
      kind: 'unknown',
      message: 'An unknown error occurred.',
      provider,
      modelId,
      retryable: true,
    };
  }

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('abort') || lower.includes('cancelled')) {
    return {
      kind: 'abort',
      message: 'Request was cancelled.',
      provider,
      modelId,
      retryable: false,
    };
  }

  if (lower.includes('api key') || lower.includes('auth') || lower.includes('401') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('403')) {
    return {
      kind: 'authentication',
      message: `${provider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'} authentication failed. Please verify your API key in Settings.`,
      provider,
      modelId,
      retryable: false,
    };
  }

  if (lower.includes('rate limit') || lower.includes('429') || lower.includes('quota') || lower.includes('too many requests')) {
    return {
      kind: 'rate_limit',
      message: 'Rate limit or quota reached. Please wait a moment or try another model.',
      provider,
      modelId,
      retryable: true,
    };
  }

  if (lower.includes('503') || lower.includes('high demand') || lower.includes('temporarily unavailable') || lower.includes('model unavailable') || lower.includes('overloaded')) {
    return {
      kind: 'model_unavailable',
      message: `${modelId || 'Selected model'} is temporarily under high demand. Try switching to Gemini or another free model.`,
      provider,
      modelId,
      retryable: true,
    };
  }

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('etimedout')) {
    return {
      kind: 'timeout',
      message: 'Request timed out waiting for provider response. Please retry.',
      provider,
      modelId,
      retryable: true,
    };
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused')) {
    return {
      kind: 'network',
      message: 'Network connection error. Check your internet connection.',
      provider,
      modelId,
      retryable: true,
    };
  }

  return {
    kind: 'unknown',
    message: raw.slice(0, 160),
    provider,
    modelId,
    retryable: true,
  };
}
