import { AIModelId, EffortLevel, AIProvider } from './ai/model-registry';
import { getModelCapabilities } from './ai/model-capabilities';
import { Storage } from './storage';

export interface RouteDecision {
  modelId: AIModelId;
  provider: AIProvider;
  effort: EffortLevel;
  isAutoRouted: boolean;
  reason?: string;
}

export class AIRouter {
  /**
   * Determine the model and provider to use based on user choice, effort, attachments, and prompt intent
   */
  static resolveRoute(
    userSelectedModel: AIModelId | 'auto',
    userSelectedEffort: EffortLevel,
    prompt: string,
    attachments: { type: string; name: string }[] = []
  ): RouteDecision {
    // 1. Manual selection strictly overrides Auto routing (Authoritative User Decision)
    if (userSelectedModel !== 'auto') {
      const provider: AIProvider =
        userSelectedModel === 'gemini-3.8-flash' || userSelectedModel === 'gemini-3.1-flash-lite'
          ? 'google'
          : 'openrouter';
      return {
        modelId: userSelectedModel,
        provider,
        effort: userSelectedEffort,
        isAutoRouted: false,
      };
    }

    // 2. Auto Multimodal Routing if attachments are present
    const hasImage = attachments.some((a) => a.type.startsWith('image/'));
    const hasAudio = attachments.some((a) => a.type.startsWith('audio/'));
    const hasVideo = attachments.some((a) => a.type.startsWith('video/'));
    const hasPdf = attachments.some(
      (a) => a.type === 'application/pdf' || a.name.toLowerCase().endsWith('.pdf')
    );

    // If media is attached in Auto mode, select dedicated multimodal models
    if (hasAudio || hasVideo) {
      return {
        modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        provider: 'openrouter',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'Audio/Video media detected: auto-routed to Nemotron 3 Nano Omni',
      };
    }

    if (hasImage) {
      return {
        modelId: 'gemini-3.8-flash',
        provider: 'google',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'Image attachment detected: auto-routed to Gemini 3.8 Flash',
      };
    }

    if (hasPdf) {
      return {
        modelId: 'gemini-3.8-flash',
        provider: 'google',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'PDF document detected: auto-routed to Gemini 3.8 Flash',
      };
    }

    // 3. Auto routing logic based on prompt keywords and structure
    const p = prompt.toLowerCase();

    // Check code / architecture / technical reasoning -> Laguna S 2.1
    const codeKeywords = [
      'code', 'bug', 'function', 'class', 'python', 'typescript', 'javascript',
      'c++', 'rust', 'sql', 'regex', 'algorithm', 'refactor', 'git', 'docker', 'api',
      'compile', 'syntax', 'react', 'css', 'html', 'backend', 'frontend'
    ];
    if (codeKeywords.some((k) => p.includes(k))) {
      return {
        modelId: 'poolside/laguna-s-2.1:free',
        provider: 'openrouter',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'Technical or code reasoning query detected: routed to Laguna S 2.1',
      };
    }

    // Check UI / design / visual / web layout -> Nex-N2.5-Pro
    const uiKeywords = ['ui', 'ux', 'design', 'layout', 'tailwind', 'component', 'wireframe', 'palette', 'mockup', 'landing page', 'visual'];
    if (uiKeywords.some((k) => p.includes(k))) {
      return {
        modelId: 'nex-agi/nex-n2.5-pro:free',
        provider: 'openrouter',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'UI or visual design query detected: routed to Nex-N2.5-Pro',
      };
    }

    // Check structured data / JSON / extraction / fast table formatting -> Nemotron
    const structuredKeywords = ['table', 'csv', 'json', 'yaml', 'bullet points', 'matrix', 'extract', 'format', 'parse', 'schema'];
    if (structuredKeywords.some((k) => p.includes(k))) {
      return {
        modelId: 'nvidia/nemotron-3.5-lightning:free',
        provider: 'openrouter',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'Structured task or data extraction detected: routed to Nemotron 3.5 Lightning',
      };
    }

    // Default primary assistant
    const creds = Storage.getCredentials();
    if (!creds.geminiApiKey && creds.openRouterApiKey) {
      return {
        modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        provider: 'openrouter',
        effort: userSelectedEffort,
        isAutoRouted: true,
        reason: 'General assistant query: routed to Nemotron 3 Ultra (550B MoE)',
      };
    }

    return {
      modelId: 'gemini-3.8-flash',
      provider: 'google',
      effort: userSelectedEffort,
      isAutoRouted: true,
      reason: 'General assistant query: routed to Gemini 3.8 Flash',
    };
  }

  /**
   * Get user credentials for a specific provider
   */
  static getCredentials(provider: AIProvider): string | undefined {
    const creds = Storage.getCredentials();
    if (provider === 'google') return creds.geminiApiKey;
    if (provider === 'openrouter') return creds.openRouterApiKey;
    return undefined;
  }
}
