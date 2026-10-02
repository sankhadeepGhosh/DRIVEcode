import {
  ColorPreset,
  ThemeColors,
  WallpaperConfig,
  UserSettings,
  Conversation,
  StoredCredentials,
  UserProfile,
} from '../types';

export const STORAGE_KEYS = {
  CREDENTIALS: 'rose.credentials.v1',
  CONVERSATIONS: 'rose.conversations.v2',
  SETTINGS: 'rose.settings.v2',
} as const;

export const COLOR_PRESETS: Record<ColorPreset, { label: string; colors: ThemeColors }> = {
  rose: {
    label: 'Rose (Default)',
    colors: {
      primaryAccent: '#E11D48',
      secondaryAccent: '#FB7185',
      background: '#FAF9F6',
      sidebarBg: '#F5F3EF',
      surface: '#FFFFFF',
      textColor: '#1F2937',
      borderColor: '#E5E7EB',
    },
  },
  ocean: {
    label: 'Ocean Blue',
    colors: {
      primaryAccent: '#0284C7',
      secondaryAccent: '#38BDF8',
      background: '#F8FAFC',
      sidebarBg: '#F1F5F9',
      surface: '#FFFFFF',
      textColor: '#0F172A',
      borderColor: '#E2E8F0',
    },
  },
  forest: {
    label: 'Forest Green',
    colors: {
      primaryAccent: '#059669',
      secondaryAccent: '#34D399',
      background: '#F7F9F6',
      sidebarBg: '#EFF4ED',
      surface: '#FFFFFF',
      textColor: '#14281D',
      borderColor: '#E1E8DE',
    },
  },
  lavender: {
    label: 'Lavender Iris',
    colors: {
      primaryAccent: '#7C3AED',
      secondaryAccent: '#A78BFA',
      background: '#FAF8FC',
      sidebarBg: '#F3EEF9',
      surface: '#FFFFFF',
      textColor: '#1F1635',
      borderColor: '#E9E1F5',
    },
  },
  amber: {
    label: 'Amber Warmth',
    colors: {
      primaryAccent: '#D97706',
      secondaryAccent: '#FBBF24',
      background: '#FAF8F4',
      sidebarBg: '#F5F0E6',
      surface: '#FFFFFF',
      textColor: '#291F11',
      borderColor: '#EBE3D3',
    },
  },
  monochrome: {
    label: 'Monochrome Slate',
    colors: {
      primaryAccent: '#18181B',
      secondaryAccent: '#71717A',
      background: '#FAFAFA',
      sidebarBg: '#F4F4F5',
      surface: '#FFFFFF',
      textColor: '#09090B',
      borderColor: '#E4E4E7',
    },
  },
};

export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'none',
  opacity: 0.15,
  blur: 0,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Surya',
  avatarType: 'preset',
  presetId: 'anime',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  colorPreset: 'rose',
  customColors: COLOR_PRESETS.rose.colors,
  font: 'inter',
  fontSize: 'medium',
  chatWidth: 'comfortable',
  desktopWallpaper: DEFAULT_WALLPAPER,
  mobileWallpaper: DEFAULT_WALLPAPER,
  defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  defaultEffort: 'medium',
  defaultMode: 'chat',
  profile: DEFAULT_PROFILE,
  voiceInput: true,
  readResponsesAloud: false,
  tone: 'balanced',
  activeMode: 'chat',
};

export function applyTheme(preset: ColorPreset, mode: 'light' | 'dark' | 'system') {
  const item = COLOR_PRESETS[preset] || COLOR_PRESETS.rose;
  const root = document.documentElement;

  root.style.setProperty('--rose-accent', item.colors.primaryAccent);
  root.style.setProperty('--rose-accent-hover', item.colors.secondaryAccent);
  root.style.setProperty(
    '--rose-accent-light',
    `${item.colors.primaryAccent}15`
  );

  let isDark = mode === 'dark';
  if (mode === 'system') {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-theme');
    root.style.setProperty('--rose-background', '#0B1120');
    root.style.setProperty('--rose-sidebar', '#080D1A');
    root.style.setProperty('--rose-surface', '#131E32');
    root.style.setProperty('--rose-border', '#1E293B');
    root.style.setProperty('--rose-text', '#F8FAFC');
    root.style.setProperty('--rose-text-muted', '#94A3B8');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-theme');
    root.style.setProperty('--rose-background', item.colors.background || '#FAF9F6');
    root.style.setProperty('--rose-sidebar', item.colors.sidebarBg || '#F5F3EF');
    root.style.setProperty('--rose-surface', item.colors.surface || '#FFFFFF');
    root.style.setProperty('--rose-border', item.colors.borderColor || '#E5E7EB');
    root.style.setProperty('--rose-text', '#111827');
    root.style.setProperty('--rose-text-muted', '#4B5563');
  }
}

export const Storage = {
  getSettings(): UserSettings {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEYS.SETTINGS) ||
        localStorage.getItem('rose.settings.v1');
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        defaultModel: parsed.defaultModel || 'gemini-3.8-flash',
        defaultEffort: parsed.defaultEffort || 'medium',
        defaultMode: parsed.defaultMode || 'chat',
        profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
        desktopWallpaper: { ...DEFAULT_WALLPAPER, ...(parsed.desktopWallpaper || {}) },
        mobileWallpaper: { ...DEFAULT_WALLPAPER, ...(parsed.mobileWallpaper || {}) },
        customColors: { ...COLOR_PRESETS.rose.colors, ...(parsed.customColors || {}) },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage: could not save settings', e);
    }
  },

  getCredentials(): StoredCredentials {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveCredentials(creds: StoredCredentials): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
    } catch (e) {
      console.warn('Storage: could not save credentials', e);
    }
  },

  clearCredentials(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    } catch {}
  },

  getConversations(): Conversation[] {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) ||
        localStorage.getItem('rose.conversations.v1') ||
        localStorage.getItem('rose_conversations_v1');
      let list: any[] = [];
      if (raw) {
        list = JSON.parse(raw);
      }

      if (!Array.isArray(list)) return [];

      // Safe migration of existing conversations
      return list.map((c: any) => ({
        id: c.id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: c.title || 'Untitled conversation',
        messages: Array.isArray(c.messages) ? c.messages : [],
        modelId: c.modelId || 'gemini-3.8-flash',
        effort: c.effort || 'medium',
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
        pinned: Boolean(c.pinned),
        archived: Boolean(c.archived),
        mode: c.mode || 'chat',
        generatedProject: c.generatedProject,
      }));
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Storage: could not save conversations', e);
    }
  },
};
