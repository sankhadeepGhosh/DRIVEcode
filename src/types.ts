import { AIModelId, EffortLevel, AIProvider, ChatMode } from './lib/ai/model-registry';

export * from './lib/ai/model-registry';
export * from './lib/ai/model-capabilities';
export * from './lib/ai/errors';
export * from './lib/usage-tracker';

export type AuraState =
  | 'idle'
  | 'typing'
  | 'listening'
  | 'uploading'
  | 'reading'
  | 'transcribing'
  | 'routing'
  | 'researching'
  | 'thinking'
  | 'generating'
  | 'building'
  | 'testing'
  | 'rendering'
  | 'streaming'
  | 'success'
  | 'error';

export interface ResearchSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publicationDate?: string;
}

export interface ResearchData {
  query: string;
  sources: ResearchSource[];
  completedAt: string;
  summary?: string;
  keyFindings?: string[];
  detailedAnalysis?: string;
  limitations?: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface GeneratedProject {
  id: string;
  title: string;
  description?: string;
  files: ProjectFile[];
  entryPoint: string;
  updatedAt: number;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // for images or preview
  textContent?: string; // for parsed text/code
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  modelUsed?: AIModelId;
  providerUsed?: AIProvider;
  effortUsed?: EffortLevel;
  error?: boolean;
  errorMessage?: string;
  attachments?: MessageAttachment[];
  researchData?: ResearchData;
  generatedProject?: GeneratedProject;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: AIModelId | 'auto';
  effort: EffortLevel;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
  mode?: ChatMode;
  generatedProject?: GeneratedProject;
}

export type RoseTone = 'balanced' | 'thoughtful' | 'creative' | 'concise';

export type AppTheme = 'light' | 'dark' | 'system';

export type ColorPreset = 'rose' | 'ocean' | 'forest' | 'lavender' | 'amber' | 'monochrome';

export interface ThemeColors {
  primaryAccent: string;
  secondaryAccent: string;
  background: string;
  sidebarBg: string;
  surface: string;
  textColor: string;
  borderColor: string;
}

export type FontChoice =
  | 'inter'
  | 'geist'
  | 'roboto'
  | 'system'
  | 'ibmPlexSans'
  | 'newsreader'
  | 'jetbrainsMono';

export type FontSizeChoice = 'small' | 'medium' | 'large' | 'xlarge';

export type ChatWidthChoice = 'compact' | 'comfortable' | 'wide';

export interface WallpaperConfig {
  type: 'none' | 'preset' | 'custom';
  presetId?: string;
  customDataUrl?: string;
  opacity: number;
  blur: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  avatarType: 'preset' | 'custom' | 'google';
  presetId: 'anime' | 'gradient' | 'minimal' | 'robot' | 'initials';
  customAvatarDataUrl?: string;
  googleAvatarUrl?: string;
}

export interface UserSettings {
  theme: AppTheme;
  colorPreset: ColorPreset;
  customColors: ThemeColors;
  font: FontChoice;
  fontSize: FontSizeChoice;
  chatWidth: ChatWidthChoice;
  desktopWallpaper: WallpaperConfig;
  mobileWallpaper: WallpaperConfig;
  defaultModel: AIModelId | 'auto';
  defaultEffort: EffortLevel;
  defaultMode: ChatMode;
  profile: UserProfile;
  voiceInput: boolean;
  readResponsesAloud: boolean;
  tone: RoseTone;
  activeMode: ChatMode;
}

export interface StoredCredentials {
  geminiApiKey?: string;
  openRouterApiKey?: string;
  geminiStatus?: 'untested' | 'connected' | 'invalid' | 'error';
  openRouterStatus?: 'untested' | 'connected' | 'invalid' | 'error';
  lastTested?: string;
}

export interface CredentialTestResult {
  provider: 'google' | 'openrouter';
  success: boolean;
  message: string;
}
