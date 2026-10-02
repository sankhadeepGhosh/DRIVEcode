import { AIModelId, EffortLevel } from './model-registry';

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsReasoning: boolean;
  supportsEffort: boolean;
  supportsMultimodal: boolean;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsPdf: boolean;
  supportsFiles: boolean;
  supportsVoice: boolean;
  maxContextTokens?: number;
}

export const MODEL_CAPABILITIES: Record<AIModelId, ModelCapabilities> = {
  'gemini-3.8-flash': {
    supportsStreaming: true,
    supportsReasoning: true,
    supportsEffort: true,
    supportsMultimodal: true,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    supportsPdf: true,
    supportsFiles: true,
    supportsVoice: true,
    maxContextTokens: 1048576,
  },
  'gemini-3.1-flash-lite': {
    supportsStreaming: true,
    supportsReasoning: true,
    supportsEffort: true,
    supportsMultimodal: true,
    supportsImages: true,
    supportsAudio: false,
    supportsVideo: false,
    supportsPdf: true,
    supportsFiles: true,
    supportsVoice: true,
    maxContextTokens: 1048576,
  },
  'nvidia/nemotron-3.5-lightning:free': {
    supportsStreaming: true,
    supportsReasoning: false,
    supportsEffort: false,
    supportsMultimodal: false,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsPdf: false,
    supportsFiles: false,
    supportsVoice: false,
    maxContextTokens: 128000,
  },
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free': {
    supportsStreaming: true,
    supportsReasoning: true,
    supportsEffort: true,
    supportsMultimodal: true,
    supportsImages: true,
    supportsAudio: true,
    supportsVideo: true,
    supportsPdf: true,
    supportsFiles: true,
    supportsVoice: false,
    maxContextTokens: 131072,
  },
  'poolside/laguna-s-2.1:free': {
    supportsStreaming: true,
    supportsReasoning: true,
    supportsEffort: true,
    supportsMultimodal: false,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsPdf: false,
    supportsFiles: false,
    supportsVoice: false,
    maxContextTokens: 64000,
  },
  'nex-agi/nex-n2.5-pro:free': {
    supportsStreaming: true,
    supportsReasoning: false,
    supportsEffort: false,
    supportsMultimodal: false,
    supportsImages: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsPdf: false,
    supportsFiles: false,
    supportsVoice: false,
    maxContextTokens: 32000,
  },
};

export function getModelCapabilities(modelId: AIModelId): ModelCapabilities {
  return (
    MODEL_CAPABILITIES[modelId] || {
      supportsStreaming: true,
      supportsReasoning: false,
      supportsEffort: false,
      supportsMultimodal: false,
      supportsImages: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsPdf: false,
      supportsFiles: false,
      supportsVoice: false,
    }
  );
}

export function validateModelAttachmentCompatibility(
  modelId: AIModelId,
  attachments: { type: string; name: string }[]
): { compatible: boolean; reason?: string; suggestedModel?: AIModelId } {
  const caps = getModelCapabilities(modelId);

  for (const att of attachments) {
    const isImg = att.type.startsWith('image/');
    const isAud = att.type.startsWith('audio/');
    const isVid = att.type.startsWith('video/');
    const isPdf = att.type === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');

    if (isImg && !caps.supportsImages) {
      return {
        compatible: false,
        reason: `${modelId} does not support image inputs.`,
        suggestedModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      };
    }
    if (isAud && !caps.supportsAudio) {
      return {
        compatible: false,
        reason: `${modelId} does not support audio inputs.`,
        suggestedModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      };
    }
    if (isVid && !caps.supportsVideo) {
      return {
        compatible: false,
        reason: `${modelId} does not support video inputs.`,
        suggestedModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      };
    }
    if (isPdf && !caps.supportsPdf) {
      return {
        compatible: false,
        reason: `${modelId} does not support PDF documents.`,
        suggestedModel: 'gemini-3.8-flash',
      };
    }
  }

  return { compatible: true };
}

export function buildEffortParameters(modelId: AIModelId, effort: EffortLevel): Record<string, unknown> {
  const caps = getModelCapabilities(modelId);
  if (!caps.supportsEffort || effort === 'auto') {
    return {};
  }

  if (modelId === 'gemini-3.8-flash' || modelId === 'gemini-3.1-flash-lite') {
    return {
      thinkingConfig: {
        thinkingBudget: effort === 'low' ? 1024 : effort === 'medium' ? 4096 : 8192,
      },
    };
  }

  if (
    modelId === 'poolside/laguna-s-2.1:free' ||
    modelId === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
  ) {
    return {
      reasoning_effort: effort,
    };
  }

  return {};
}
