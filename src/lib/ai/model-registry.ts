export type AIModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'nvidia/nemotron-3.5-lightning:free'
  | 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
  | 'poolside/laguna-s-2.1:free'
  | 'nex-agi/nex-n2.5-pro:free';

export type AIProvider = 'google' | 'openrouter';

export type EffortLevel = 'auto' | 'low' | 'medium' | 'high';

export type ChatMode = 'chat' | 'research' | 'website';

export interface ModelDefinition {
  id: AIModelId;
  provider: AIProvider;
  label: string;
  role: string;
  description: string;
  badge?: string;
  specialty: 'general' | 'structured' | 'multimodal' | 'code' | 'visual';
}

export const DEFAULT_GEMINI_MODEL: AIModelId = 'gemini-3.8-flash';
export const GEMINI_MODEL: AIModelId = DEFAULT_GEMINI_MODEL;

export const AI_MODELS = {
  geminiFlash: {
    id: 'gemini-3.8-flash',
    provider: 'google',
    label: 'Gemini 3.8 Flash',
    role: 'Primary assistant',
    description: 'High-capability multi-step reasoning, coding & agentic workflows',
    badge: 'Google',
    specialty: 'general',
  },
  geminiFlashLite: {
    id: 'gemini-3.1-flash-lite',
    provider: 'google',
    label: 'Gemini 3.1 Flash-Lite',
    role: 'Fast secondary assistant',
    description: 'Ultra-fast low-latency general processing',
    badge: 'Google',
    specialty: 'general',
  },
  nemotronLightning: {
    id: 'nvidia/nemotron-3.5-lightning:free',
    provider: 'openrouter',
    label: 'Nemotron 3.5 Lightning',
    role: 'Fast structured reasoning',
    description: 'High-throughput structured and analytical tasks',
    badge: 'Free',
    specialty: 'structured',
  },
  nemotronOmni: {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    provider: 'openrouter',
    label: 'Nemotron 3 Nano Omni',
    role: 'Multimodal / Files / Images / Audio / Video',
    description: 'Specialized free multimodal model supporting text, images, audio, video & files',
    badge: 'Free Multimodal',
    specialty: 'multimodal',
  },
  laguna: {
    id: 'poolside/laguna-s-2.1:free',
    provider: 'openrouter',
    label: 'Laguna S 2.1',
    role: 'Coding and architecture',
    description: 'Code synthesis, algorithms, and deep technical reasoning',
    badge: 'Free',
    specialty: 'code',
  },
  nex: {
    id: 'nex-agi/nex-n2.5-pro:free',
    provider: 'openrouter',
    label: 'Nex-N2.5-Pro',
    role: 'UI and visual reasoning',
    description: 'Interface design, front-end styling, and visual reasoning',
    badge: 'Free',
    specialty: 'visual',
  },
} as const;

export const MODEL_LIST: ModelDefinition[] = [
  AI_MODELS.geminiFlash,
  AI_MODELS.geminiFlashLite,
  AI_MODELS.nemotronLightning,
  AI_MODELS.nemotronOmni,
  AI_MODELS.laguna,
  AI_MODELS.nex,
];
