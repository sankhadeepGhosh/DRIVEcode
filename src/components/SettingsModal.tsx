import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Palette,
  Mic,
  Cpu,
  User,
  Check,
  ExternalLink,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  BarChart3,
  Download,
  Upload,
  Globe,
  Monitor,
  Smartphone,
  Sliders,
  Type,
  LogOut,
  Shield,
} from 'lucide-react';
import {
  UserSettings,
  StoredCredentials,
  FontChoice,
  FontSizeChoice,
  AppTheme,
  ColorPreset,
  ChatWidthChoice,
  UserProfile,
} from '../types';
import { FONT_DEFINITIONS, FONT_SIZES } from '../lib/fonts';
import { COLOR_PRESETS } from '../lib/storage';
import { UsageTracker, AggregatedUsage } from '../lib/usage-tracker';
import { DirectAIClient } from '../lib/ai/direct-client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  credentials: StoredCredentials;
  onSaveCredentials: (newCreds: Partial<StoredCredentials>) => void;
  onClearCredentials: () => void;
  onResetAppearance: () => void;
  authUserEmail?: string;
  onSignOut?: () => void;
  initialTab?: 'appearance' | 'ai' | 'profile' | 'voice' | 'usage' | 'credentials';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  credentials,
  onSaveCredentials,
  onClearCredentials,
  onResetAppearance,
  authUserEmail,
  onSignOut,
  initialTab = 'appearance',
}) => {
  const [activeTab, setActiveTab] = useState<
    'appearance' | 'ai' | 'profile' | 'voice' | 'usage' | 'credentials'
  >(initialTab);

  // Sync activeTab when initialTab changes or modal opens
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Key form states
  const [geminiKeyInput, setGeminiKeyInput] = useState(credentials.geminiApiKey || '');
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(credentials.openRouterApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync inputs with credentials prop if updated externally
  useEffect(() => {
    setGeminiKeyInput(credentials.geminiApiKey || '');
    setOpenRouterKeyInput(credentials.openRouterApiKey || '');
  }, [credentials]);

  // Profile states
  const [profileName, setProfileName] = useState(settings.profile?.name || 'Surya');

  // Testing status
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [geminiTestMessage, setGeminiTestMessage] = useState<string | null>(null);
  const [openRouterTestMessage, setOpenRouterTestMessage] = useState<string | null>(null);

  // Usage tab states
  const [usageTimeframe, setUsageTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [usageData, setUsageData] = useState<AggregatedUsage>(() => UsageTracker.getAggregated('all'));

  useEffect(() => {
    if (activeTab === 'usage') {
      setUsageData(UsageTracker.getAggregated(usageTimeframe));
    }
  }, [activeTab, usageTimeframe]);

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    onSaveCredentials({
      geminiApiKey: geminiKeyInput.trim() || undefined,
      openRouterApiKey: openRouterKeyInput.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestMessage(null);
    try {
      const res = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          apiKey: geminiKeyInput.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiTestMessage(data.message || (data.success ? 'Connected successfully!' : 'Check failed.'));
        return;
      }
    } catch {}

    // Fallback to direct client verification if backend is unavailable (e.g. Cloudflare static)
    try {
      const direct = await DirectAIClient.testGeminiKey(geminiKeyInput.trim());
      setGeminiTestMessage(direct.message);
    } catch {
      setGeminiTestMessage('Network error during test.');
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOpenRouter = async () => {
    setTestingOpenRouter(true);
    setOpenRouterTestMessage(null);
    try {
      const res = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openrouter',
          apiKey: openRouterKeyInput.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpenRouterTestMessage(data.message || (data.success ? 'Connected successfully!' : 'Check failed.'));
        return;
      }
    } catch {}

    // Fallback to direct client verification if backend is unavailable (e.g. Cloudflare static)
    try {
      const direct = await DirectAIClient.testOpenRouterKey(openRouterKeyInput.trim());
      setOpenRouterTestMessage(direct.message);
    } catch {
      setOpenRouterTestMessage('Network error during test.');
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const handleDesktopWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({
        desktopWallpaper: {
          ...settings.desktopWallpaper,
          type: 'custom',
          customDataUrl: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMobileWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({
        mobileWallpaper: {
          ...settings.mobileWallpaper,
          type: 'custom',
          customDataUrl: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({
        profile: {
          ...settings.profile,
          avatarType: 'custom',
          customAvatarDataUrl: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExportUsageJSON = () => {
    const json = UsageTracker.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rose-usage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportUsageCSV = () => {
    const csv = UsageTracker.exportAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rose-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearUsage = () => {
    if (confirm('Clear all local API usage records? Conversations will not be affected.')) {
      UsageTracker.clear();
      setUsageData(UsageTracker.getAggregated(usageTimeframe));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 text-lg">DRIVEcode Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-[#FAF9F6] px-3 sm:px-4 pt-2 gap-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
            { id: 'ai', label: 'AI & Models', icon: <Cpu className="w-4 h-4" /> },
            { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
            { id: 'voice', label: 'Voice & Speech', icon: <Mic className="w-4 h-4" /> },
            { id: 'usage', label: 'Usage Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'credentials', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#E11D48] text-[#E11D48] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {/* 1. Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Accent Color Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(COLOR_PRESETS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          colorPreset: key as ColorPreset,
                          customColors: item.colors,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        settings.colorPreset === key
                          ? 'border-[#E11D48] bg-rose-50/40 shadow-2xs font-semibold text-gray-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: item.colors.primaryAccent }}
                      />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Display Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', desc: 'Warm minimalist' },
                    { id: 'dark', label: 'Dark', desc: 'Soft dark slate' },
                    { id: 'system', label: 'System', desc: 'Match OS' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: t.id as AppTheme })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.theme === t.id
                          ? 'border-[#E11D48] bg-rose-50/50 text-gray-900 shadow-2xs font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-gray-900">{t.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Font Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Typography Font
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(FONT_DEFINITIONS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onUpdateSettings({ font: key as FontChoice })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.font === key
                          ? 'border-[#E11D48] bg-rose-50/50 text-gray-900 shadow-2xs font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: item.family }}
                    >
                      <div className="text-xs">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Chat Width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Reading Font Size
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(FONT_SIZES).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onUpdateSettings({ fontSize: key as FontSizeChoice })}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          settings.fontSize === key
                            ? 'border-[#E11D48] bg-rose-50/50 text-[#E11D48] font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Chat Column Width
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'compact', label: 'Compact' },
                      { id: 'comfortable', label: 'Default' },
                      { id: 'wide', label: 'Wide' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onUpdateSettings({ chatWidth: w.id as ChatWidthChoice })}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          settings.chatWidth === w.id
                            ? 'border-[#E11D48] bg-rose-50/50 text-[#E11D48] font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs">{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Responsive Wallpapers */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Custom Wallpaper
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Desktop Wallpaper */}
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-gray-500" />
                        <span>Desktop Background</span>
                      </span>
                      {settings.desktopWallpaper.type === 'custom' && (
                        <button
                          onClick={() =>
                            onUpdateSettings({
                              desktopWallpaper: { ...settings.desktopWallpaper, type: 'none', customDataUrl: undefined },
                            })
                          }
                          className="text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{settings.desktopWallpaper.type === 'custom' ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDesktopWallpaperUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Mobile Wallpaper */}
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                        <span>Mobile Background</span>
                      </span>
                      {settings.mobileWallpaper.type === 'custom' && (
                        <button
                          onClick={() =>
                            onUpdateSettings({
                              mobileWallpaper: { ...settings.mobileWallpaper, type: 'none', customDataUrl: undefined },
                            })
                          }
                          className="text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <label className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{settings.mobileWallpaper.type === 'custom' ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMobileWallpaperUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Reset Appearance Button */}
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={onResetAppearance}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Reset appearance to default
                </button>
              </div>
            </div>
          )}

          {/* 2. AI & Models Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Default AI Model
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Choose which model new conversations start with.
                </p>
                <select
                  value={settings.defaultModel}
                  onChange={(e) => onUpdateSettings({ defaultModel: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="nvidia/nemotron-3-ultra-550b-a55b:free">Nemotron 3 Ultra (550B Frontier Reasoning - Free)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Primary Multi-Step Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast Secondary Assistant)</option>
                  <option value="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free">Nemotron 3 Nano Omni (Free Multimodal Media & Reasoning)</option>
                  <option value="nvidia/nemotron-3.5-lightning:free">Nemotron 3.5 Lightning (Fast Structured Reasoning)</option>
                  <option value="poolside/laguna-s-2.1:free">Laguna S 2.1 (Coding & Architecture)</option>
                  <option value="nex-agi/nex-n2.5-pro:free">Nex-N2.5-Pro (UI & Web Design)</option>
                  <option value="auto">Auto (Smart Dynamic Routing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Default Reasoning Effort
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Controls thinking budget on Gemini and reasoning depth on OpenRouter reasoning models.
                </p>
                <select
                  value={settings.defaultEffort}
                  onChange={(e) => onUpdateSettings({ defaultEffort: e.target.value as any })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="auto">Auto (Adaptive)</option>
                  <option value="low">Low (Fastest)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Deep reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Default Interaction Mode
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select the default initial behavior for new sessions.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'chat', label: 'Chat Assistant', desc: 'Direct conversation' },
                    { id: 'research', label: 'Deep Research', desc: 'Real-time citations' },
                    { id: 'website', label: 'Website Builder', desc: 'Instant UI generation' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateSettings({ defaultMode: m.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.defaultMode === m.id
                          ? 'border-[#E11D48] bg-rose-50/50 text-gray-900 shadow-2xs font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-semibold text-gray-900">{m.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800 block mb-1">Available Models:</span>
                <ul className="space-y-1 list-disc list-inside text-[11px] text-gray-600">
                  <li><strong>Nemotron 3 Ultra:</strong> NVIDIA 550B MoE frontier reasoning with 1M context (Free).</li>
                  <li><strong>Gemini 3.8 Flash:</strong> Google primary assistant for complex reasoning, websites & agentic tasks.</li>
                  <li><strong>Gemini 3.1 Flash-Lite:</strong> Google ultra-fast secondary assistant.</li>
                  <li><strong>Nemotron 3 Nano Omni:</strong> Free multimodal powerhouse supporting images, audio, video & reasoning.</li>
                  <li><strong>Nemotron 3.5 Lightning:</strong> Fast structured analytical reasoning.</li>
                  <li><strong>Laguna S 2.1:</strong> Technical coding and algorithm synthesis.</li>
                  <li><strong>Nex-N2.5-Pro:</strong> UI, layout, and front-end design reasoning.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 3. User Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Account Information Card */}
              {authUserEmail && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-xs text-rose-600 font-bold">
                      {settings.profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{settings.profile?.name || 'User'}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Google Account
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">{authUserEmail}</div>
                    </div>
                  </div>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#E11D48]"
                  />
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        profile: { ...settings.profile, name: profileName.trim() || 'Surya' },
                      })
                    }
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Avatar Style
                </label>

                {/* Google Avatar Option if available */}
                {settings.profile?.googleAvatarUrl && (
                  <div className="mb-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={settings.profile.googleAvatarUrl}
                        alt="Google avatar"
                        className="w-8 h-8 rounded-full border border-gray-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-800">Use Google Profile Photo</div>
                        <div className="text-[11px] text-gray-500">Synchronized from your Google account</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          profile: {
                            ...settings.profile,
                            avatarType: 'google',
                          },
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        settings.profile?.avatarType === 'google'
                          ? 'bg-[#E11D48] text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {settings.profile?.avatarType === 'google' ? 'Selected' : 'Use Photo'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'anime', label: 'Anime Sparkle', icon: '✨' },
                    { id: 'gradient', label: 'Sunset Glow', icon: '🌅' },
                    { id: 'minimal', label: 'Minimalist', icon: '🌿' },
                    { id: 'robot', label: 'Cyber Mech', icon: '🤖' },
                  ].map((av) => (
                    <button
                      key={av.id}
                      onClick={() =>
                        onUpdateSettings({
                          profile: {
                            ...settings.profile,
                            avatarType: 'preset',
                            presetId: av.id as any,
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.profile?.avatarType === 'preset' &&
                        settings.profile?.presetId === av.id
                          ? 'border-[#E11D48] bg-rose-50/50 shadow-2xs font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{av.icon}</span>
                      <span className="text-xs text-gray-800 font-medium">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
                <span className="text-xs font-semibold text-gray-800 block mb-1">
                  Or Upload Custom Avatar Image
                </span>
                <label className="inline-flex items-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs mt-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 4. Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <div>
                  <span className="font-semibold text-xs text-gray-800 block">Voice Speech-To-Text</span>
                  <span className="text-[11px] text-gray-500">Allow microphone recording to dictate prompts into DRIVEcode</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voiceInput}
                  onChange={(e) => onUpdateSettings({ voiceInput: e.target.checked })}
                  className="w-4 h-4 accent-[#E11D48] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <div>
                  <span className="font-semibold text-xs text-gray-800 block">Read Responses Aloud (TTS)</span>
                  <span className="text-[11px] text-gray-500">Enable text-to-speech playback on completed assistant answers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.readResponsesAloud}
                  onChange={(e) => onUpdateSettings({ readResponsesAloud: e.target.checked })}
                  className="w-4 h-4 accent-[#E11D48] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 5. Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-5">
              {/* Filter controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {(['today', '7d', '30d', 'all'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setUsageTimeframe(t)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize ${
                        usageTimeframe === t ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportUsageCSV}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleExportUsageJSON}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Requests</span>
                  <span className="text-lg font-bold text-gray-900">{usageData.totalRequests}</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Tokens</span>
                  <span className="text-lg font-bold text-[#E11D48]">{usageData.totalTokens.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Google Gemini</span>
                  <span className="text-lg font-bold text-gray-900">{usageData.googleRequests} reqs</span>
                  <span className="text-[10px] text-gray-400 block">{usageData.googleTokens.toLocaleString()} tok</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">OpenRouter</span>
                  <span className="text-lg font-bold text-gray-900">{usageData.openRouterRequests} reqs</span>
                  <span className="text-[10px] text-gray-400 block">{usageData.openRouterTokens.toLocaleString()} tok</span>
                </div>
              </div>

              {/* Per-Model Usage Breakdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Usage By Model
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-semibold text-gray-600 grid grid-cols-4">
                    <span className="col-span-2">Model</span>
                    <span className="text-right">Requests</span>
                    <span className="text-right">Tokens</span>
                  </div>
                  {Object.keys(usageData.byModel).length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-xs">
                      No usage records yet. Start chatting to see metrics!
                    </div>
                  ) : (
                    Object.entries(usageData.byModel).map(([model, stats]) => (
                      <div key={model} className="px-3 py-2 border-b border-gray-100 grid grid-cols-4 items-center">
                        <span className="col-span-2 font-medium text-gray-900 truncate">{model}</span>
                        <span className="text-right text-gray-600">{stats.requests}</span>
                        <span className="text-right font-mono text-gray-800">{stats.totalTokens.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClearUsage}
                  className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Usage History</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-900 leading-relaxed">
                DRIVEcode provides server-side Gemini by default. You can optionally provide your own Google Gemini API key or OpenRouter API key for high quotas, custom limits, and full model routing.
              </div>

              {/* Gemini Key Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Google Gemini API Key</span>
                    <span className="text-[11px] text-gray-500">For Gemini 3.8 Flash & Gemini 3.1 Flash-Lite</span>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#E11D48] hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm sm:text-xs font-mono text-gray-900 focus:outline-none focus:border-[#E11D48]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleTestGemini}
                    disabled={!geminiKeyInput || testingGemini}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                  >
                    {testingGemini ? 'Verifying...' : 'Test Connection'}
                  </button>
                  {geminiTestMessage && (
                    <span className="text-xs font-medium text-gray-700">{geminiTestMessage}</span>
                  )}
                </div>
              </div>

              {/* OpenRouter Key Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">OpenRouter API Key</span>
                    <span className="text-[11px] text-gray-500">Unlocks Nemotron, Laguna, and Nex</span>
                  </div>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#E11D48] hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={openRouterKeyInput}
                    onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full pl-3 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm sm:text-xs font-mono text-gray-900 focus:outline-none focus:border-[#E11D48]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleTestOpenRouter}
                    disabled={!openRouterKeyInput || testingOpenRouter}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                  >
                    {testingOpenRouter ? 'Verifying...' : 'Test Connection'}
                  </button>
                  {openRouterTestMessage && (
                    <span className="text-xs font-medium text-gray-700">{openRouterTestMessage}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveKeys}
                    className="px-4 py-2 bg-[#E11D48] text-white rounded-xl text-xs font-bold hover:bg-[#BE123C] cursor-pointer shadow-xs"
                  >
                    Save API Keys
                  </button>
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Keys saved!</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={onClearCredentials}
                  className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Stored Keys</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
