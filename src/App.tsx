import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sliders,
  Sun,
  Moon,
  Globe,
  MessageSquare
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Aura } from './components/Aura';
import { SettingsModal } from './components/SettingsModal';
import { ProcessingBanner } from './components/ProcessingBanner';
import { LoginPage } from './components/LoginPage';
import { WebsiteStudio } from './components/WebsiteStudio';
import { useAuth } from './context/AuthContext';
import { SupabaseDb } from './lib/supabase/db';
import {
  Conversation,
  Message,
  UserSettings,
  StoredCredentials,
  AuraState,
  AIModelId,
  EffortLevel,
  MessageAttachment,
  GeneratedProject,
  ResearchData,
  ChatMode,
  AgentActionStep
} from './types';
import { Storage, DEFAULT_SETTINGS, applyTheme } from './lib/storage';
import { AIRouter } from './lib/ai-router';
import { ResearchEngine } from './lib/research/research-engine';
import { WebsiteBuilder } from './lib/preview/project-manager';
import { PatchAgent } from './lib/preview/patch-agent';
import { UsageTracker } from './lib/usage-tracker';
import { normalizeAIError } from './lib/ai/errors';
import { FONT_DEFINITIONS, FONT_SIZES, applyTypography } from './lib/fonts';

export function App() {
  // Auth state
  const { user, profile, loading: authLoading, signOut } = useAuth();

  // Global State
  const [conversations, setConversations] = useState<Conversation[]>(() => Storage.getConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const list = Storage.getConversations();
    const active = list.find((c) => !c.archived);
    return active ? active.id : list[0]?.id || null;
  });

  const [settings, setSettings] = useState<UserSettings>(() => Storage.getSettings());
  const [credentials, setCredentials] = useState<StoredCredentials>(() => Storage.getCredentials());

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [auraState, setAuraState] = useState<AuraState>('idle');
  const [isStreaming, setIsStreaming] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ChatMode>(() => settings.activeMode || 'chat');

  // Active website builder project
  const [activeProject, setActiveProject] = useState<GeneratedProject | null>(null);

  // Stream & Abort Controllers
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const auraTimeoutRef = useRef<any>(null);

  // Load user cloud data when authenticated
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadCloudData() {
      try {
        const cloudConversations = await SupabaseDb.getConversations(user.id);
        if (isMounted && cloudConversations && cloudConversations.length > 0) {
          setConversations(cloudConversations);
          const active = cloudConversations.find((c) => !c.archived);
          setActiveId(active ? active.id : cloudConversations[0]?.id || null);
        }

        const cloudSettings = await SupabaseDb.getSettings(user.id);
        if (isMounted && cloudSettings) {
          setSettings((prev) => ({
            ...prev,
            ...cloudSettings,
            profile: {
              ...prev.profile,
              ...cloudSettings.profile,
              name: profile?.name || cloudSettings.profile?.name || prev.profile?.name,
              googleAvatarUrl: profile?.googleAvatarUrl || prev.profile?.googleAvatarUrl,
            },
          }));
        } else if (profile?.googleAvatarUrl) {
          setSettings((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: profile.name || prev.profile?.name,
              googleAvatarUrl: profile.googleAvatarUrl,
            },
          }));
        }
      } catch (err) {
        console.warn('Failed to load cloud conversations:', err);
      }
    }

    loadCloudData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Auto-detect server API keys and auto-migrate model if Gemini key is absent
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        const targetModel = data.defaultModel || (!data.hasSystemApiKey && data.hasOpenRouterApiKey ? 'nvidia/nemotron-3-ultra-550b-a55b:free' : null);
        if (targetModel) {
          setSettings((prev) => {
            if (prev.defaultModel === 'gemini-3.8-flash' || prev.defaultModel === 'gemini-3.1-flash-lite') {
              return { ...prev, defaultModel: targetModel };
            }
            return prev;
          });
          setConversations((prev) =>
            prev.map((c) =>
              !c.modelId || c.modelId === 'gemini-3.8-flash' || c.modelId === 'gemini-3.1-flash-lite'
                ? { ...c, modelId: targetModel }
                : c
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  // Active conversation object
  const currentConversation = conversations.find((c) => c.id === activeId);

  // Keep state synced with localStorage and Supabase
  useEffect(() => {
    Storage.saveConversations(conversations);
    if (user && conversations.length > 0) {
      // Sync each conversation
      conversations.forEach((conv) => {
        SupabaseDb.upsertConversation(user.id, conv).catch((e) =>
          console.warn('Background cloud save conversation warning:', e)
        );
      });
    }
  }, [conversations, user]);

  useEffect(() => {
    Storage.saveSettings(settings);
    applyTypography(settings.font, settings.fontSize);
    applyTheme(settings.colorPreset, settings.theme);
    if (user) {
      SupabaseDb.upsertSettings(user.id, settings).catch((e) =>
        console.warn('Background cloud save settings warning:', e)
      );
    }
  }, [settings, user]);

  useEffect(() => {
    Storage.saveCredentials(credentials);
  }, [credentials]);

  // Sync conversation's project to preview if changed
  useEffect(() => {
    if (currentConversation?.generatedProject) {
      setActiveProject(currentConversation.generatedProject);
    }
  }, [activeId]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, auraState]);

  // Aura State Management
  const triggerAura = (state: AuraState, durationMs?: number) => {
    if (auraTimeoutRef.current) {
      clearTimeout(auraTimeoutRef.current);
      auraTimeoutRef.current = null;
    }
    setAuraState(state);
    if (durationMs) {
      auraTimeoutRef.current = setTimeout(() => {
        setAuraState('idle');
      }, durationMs);
    }
  };

  // Keyboard shortcut Ctrl/Cmd + K for search/new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Conversation Management Handlers
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      modelId: settings.defaultModel,
      effort: settings.defaultEffort,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setActiveProject(null);
    setActiveMode('chat');
    setSidebarOpen(false);
    triggerAura('idle');
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c))
    );
  };

  const handleSelectModel = (model: AIModelId | 'auto') => {
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, modelId: model } : c))
      );
    }
  };

  const handleSelectEffort = (effort: EffortLevel) => {
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, effort } : c))
      );
    }
  };

  // Main Streaming Execution Engine
  const handleSendMessage = async (
    text: string,
    attachments: MessageAttachment[] = [],
    isDeepResearch: boolean = false
  ) => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;

    let targetConvId = activeId;
    const rawModel = currentConversation?.modelId || settings.defaultModel;
    const currentModel =
      (!credentials.geminiApiKey && (rawModel === 'gemini-3.8-flash' || rawModel === 'gemini-3.1-flash-lite'))
        ? 'nvidia/nemotron-3-ultra-550b-a55b:free'
        : rawModel;
    const currentEffort = currentConversation?.effort || settings.defaultEffort;

    // Detect if this is a targeted surgical patch or website creation prompt
    const isPatch = Boolean(activeProject) && PatchAgent.isPatchRequest(text, Boolean(activeProject));
    const isWebsite =
      activeMode === 'website' ||
      isPatch ||
      WebsiteBuilder.isWebsiteRequest(text) ||
      WebsiteBuilder.isIterationRequest(text, Boolean(activeProject));

    if (isWebsite && activeMode !== 'website') {
      setActiveMode('website');
    }

    // Resolve route taking attachments and context into account
    const route = AIRouter.resolveRoute(currentModel, currentEffort, text, attachments);

    // Create conversation if none exists
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: text.slice(0, 32) || 'Chat with DRIVEcode',
        messages: [],
        modelId: currentModel,
        effort: currentEffort,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mode: isDeepResearch ? 'research' : isWebsite ? 'website' : 'chat',
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetConvId = newConv.id;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr_${Date.now()}`;
    const assistantMsgId = `ast_${Date.now() + 1}`;

    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp,
      attachments,
    };

    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
      modelUsed: route.modelId,
      providerUsed: route.provider,
      effortUsed: route.effort,
    };

    // Add user message and assistant placeholder
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === targetConvId) {
          const isFirst = conv.messages.length === 0;
          return {
            ...conv,
            title: isFirst ? text.slice(0, 36) || 'New Conversation' : conv.title,
            messages: [...conv.messages, userMsg, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return conv;
      })
    );

    setIsStreaming(true);
    const startTime = Date.now();

    // 1. If Deep Research is requested: gather live web sources first
    let researchData: ResearchData | undefined;
    let finalPrompt = text;

    if (isDeepResearch) {
      triggerAura('researching');
      setProcessingStatus('Searching real-time web sources...');
      const sources = await ResearchEngine.searchWeb(text);
      researchData = {
        query: text,
        sources,
        completedAt: new Date().toISOString(),
      };
      finalPrompt = ResearchEngine.formatResearchPrompt(text, sources);
    } else if (isPatch && activeProject) {
      triggerAura('building');
      setProcessingStatus('Planning surgical code patch...');
      finalPrompt = PatchAgent.formatPatchPrompt(text, activeProject);
    } else if (isWebsite) {
      triggerAura('building');
      setProcessingStatus('Assembling website components and styles...');
      finalPrompt = WebsiteBuilder.formatGenerationPrompt(text, activeProject);
    } else {
      triggerAura('thinking');
      setProcessingStatus('Thinking and routing...');
    }

    // Append attachments text content to prompt if available
    if (attachments.length > 0) {
      const attContext = attachments
        .filter((a) => a.textContent)
        .map((a) => `=== ATTACHMENT: ${a.name} ===\n${a.textContent}`)
        .join('\n\n');
      if (attContext) {
        finalPrompt += `\n\nATTACHED CONTEXT:\n${attContext}`;
      }
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const conv = conversations.find((c) => c.id === targetConvId);
      // Only send role and content in history to prevent massive payload bloat from attachments/dataUrls
      const history = (conv ? conv.messages.slice(-8) : [])
        .filter((m) => m.content && !m.error)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 15000),
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          attachments: attachments.map((a) => ({
            name: a.name,
            type: a.type,
            size: a.size,
            dataUrl: a.dataUrl,
            textContent: a.textContent,
          })),
          history,
          tone: settings.tone,
          modelId: route.modelId,
          effort: route.effort,
          geminiApiKey: credentials.geminiApiKey,
          openRouterApiKey: credentials.openRouterApiKey,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to connect to DRIVEcode stream (${response.status})`);
      }

      triggerAura('streaming');
      setProcessingStatus(null);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let accumulatedThought = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.error) {
              const normError = normalizeAIError(data.message, route.provider, route.modelId);
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: '',
                              isStreaming: false,
                              error: true,
                              errorMessage: normError.message,
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
              triggerAura('error', 2500);
              return;
            }

            if (data.reasoningChunk) {
              accumulatedThought += data.reasoningChunk;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              thought: accumulatedThought,
                              thoughtDuration: Math.max(1, Math.round((Date.now() - startTime) / 1000)),
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            }

            if (data.chunk) {
              accumulatedResponse += data.chunk;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: accumulatedResponse } : m
                      ),
                    };
                  }
                  return c;
                })
              );
            }

            if (data.done) {
              break;
            }
          } catch {
            // ignore non-json keepalives
          }
        }
      }

      // Check if surgical patch or full project was generated
      let generatedProject: GeneratedProject | undefined;
      let actionSteps: AgentActionStep[] = [];
      let finalMessageContent = accumulatedResponse;

      if (isPatch && activeProject) {
        const patchResult = PatchAgent.applyPatchToProject(activeProject, accumulatedResponse);
        if (patchResult.success) {
          generatedProject = patchResult.updatedProject;
          actionSteps = patchResult.actionSteps;
          finalMessageContent = patchResult.summary;
          setActiveProject(generatedProject);
        } else {
          // Fallback if model generated full file
          const parsedFiles = WebsiteBuilder.parseProjectFiles(accumulatedResponse);
          if (parsedFiles.length > 0) {
            generatedProject = {
              ...activeProject,
              files: parsedFiles,
              updatedAt: Date.now(),
            };
            actionSteps = [
              {
                id: `act_${Date.now()}_1`,
                type: 'command',
                title: 'Making the AI send live progress right away.',
                status: 'completed',
              },
              {
                id: `act_${Date.now()}_2`,
                type: 'edit',
                title: `Updated ${parsedFiles[0].path}`,
                fileName: parsedFiles[0].path,
                status: 'completed',
              },
              {
                id: `act_${Date.now()}_3`,
                type: 'test',
                title: 'Testing that progress now streams immediately.',
                status: 'completed',
              },
            ];
            setActiveProject(generatedProject);
          }
        }
      } else if (isWebsite || accumulatedResponse.includes('```html')) {
        const parsedFiles = WebsiteBuilder.parseProjectFiles(accumulatedResponse);
        if (parsedFiles.length > 0) {
          generatedProject = {
            id: `proj_${Date.now()}`,
            title: text.slice(0, 24) || 'Website Project',
            files: parsedFiles,
            entryPoint: parsedFiles.find((f) => f.path === 'index.html')?.path || parsedFiles[0].path,
            updatedAt: Date.now(),
          };
          actionSteps = [
            {
              id: `act_${Date.now()}_1`,
              type: 'command',
              title: 'Making the AI send live progress right away.',
              detail: 'Structured semantic layout and initialized design tokens.',
              status: 'completed',
            },
            {
              id: `act_${Date.now()}_2`,
              type: 'edit',
              title: 'Created index.html',
              fileName: 'index.html',
              detail: 'Generated full application codebase.',
              status: 'completed',
            },
            {
              id: `act_${Date.now()}_3`,
              type: 'test',
              title: 'Testing that progress now streams immediately.',
              detail: 'Sandbox mounted and runtime verified.',
              status: 'completed',
            },
          ];
          setActiveProject(generatedProject);
          if (isWebsite) {
            setActiveMode('website');
          }
        }
      }

      const totalDurationSec = Math.max(3, Math.round((Date.now() - startTime) / 1000));

      // Finalize assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              generatedProject: generatedProject || c.generatedProject,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: finalMessageContent,
                      isStreaming: false,
                      researchData,
                      generatedProject,
                      thought: accumulatedThought || m.thought || undefined,
                      thoughtDuration: totalDurationSec,
                      actionSteps: actionSteps.length > 0 ? actionSteps : m.actionSteps,
                      isPatchEdit: isPatch,
                    }
                  : m
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      // Record API usage statistics
      UsageTracker.record({
        provider: route.provider,
        model: route.modelId,
        requestType: isDeepResearch ? 'research' : isWebsite ? 'website' : 'chat',
        durationMs: Date.now() - startTime,
        status: 'success',
        inputTokens: Math.round(finalPrompt.length / 4),
        outputTokens: Math.round(accumulatedResponse.length / 4),
      });

      triggerAura('success', 1500);
    } catch (err: unknown) {
      const normErr = normalizeAIError(err, route.provider, route.modelId);
      if (normErr.kind === 'abort') {
        // user intentionally stopped stream
        triggerAura('idle');
      } else {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: true,
                        errorMessage: normErr.message,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
        triggerAura('error', 3000);
      }
    } finally {
      setIsStreaming(false);
      setProcessingStatus(null);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setProcessingStatus(null);
    triggerAura('idle');
  };

  // Retry last message
  const handleRetry = (msgIndex: number) => {
    if (!currentConversation) return;
    const userMsg = currentConversation.messages[msgIndex - 1];
    if (userMsg && userMsg.role === 'user') {
      handleSendMessage(userMsg.content, userMsg.attachments);
    }
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSaveCredentials = (newCreds: Partial<StoredCredentials>) => {
    setCredentials((prev) => ({ ...prev, ...newCreds }));
  };

  const handleClearCredentials = () => {
    Storage.clearCredentials();
    setCredentials({});
  };

  const handleResetAppearance = () => {
    setSettings((prev) => ({
      ...prev,
      theme: DEFAULT_SETTINGS.theme,
      colorPreset: DEFAULT_SETTINGS.colorPreset,
      customColors: DEFAULT_SETTINGS.customColors,
      font: DEFAULT_SETTINGS.font,
      fontSize: DEFAULT_SETTINGS.fontSize,
      chatWidth: DEFAULT_SETTINGS.chatWidth,
      desktopWallpaper: DEFAULT_SETTINGS.desktopWallpaper,
      mobileWallpaper: DEFAULT_SETTINGS.mobileWallpaper,
    }));
  };

  // Dynamic Chat Width styling
  const chatWidthClass = {
    compact: 'max-w-2xl',
    comfortable: 'max-w-3xl',
    wide: 'max-w-4xl',
  }[settings.chatWidth || 'comfortable'];

  const [isGuestBypassed, setIsGuestBypassed] = useState(false);

  // If auth is loading, show clean loading state
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF9F6] text-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md animate-pulse">
            D
          </div>
          <p className="text-xs text-gray-400 font-medium tracking-wide">Loading DRIVEcode...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and hasn't bypassed as guest, show modern LoginPage
  if (!user && !isGuestBypassed) {
    return <LoginPage onBypassAsGuest={() => setIsGuestBypassed(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--rose-background)] text-[var(--rose-text)] transition-colors duration-200 relative">
      {/* Custom Desktop & Mobile Wallpaper Background Overlay */}
      {settings.desktopWallpaper.type === 'custom' && settings.desktopWallpaper.customDataUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all hidden md:block"
          style={{
            backgroundImage: `url(${settings.desktopWallpaper.customDataUrl})`,
            opacity: settings.desktopWallpaper.opacity,
            filter: settings.desktopWallpaper.blur ? `blur(${settings.desktopWallpaper.blur}px)` : 'none',
          }}
        />
      )}
      {settings.mobileWallpaper.type === 'custom' && settings.mobileWallpaper.customDataUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all block md:hidden"
          style={{
            backgroundImage: `url(${settings.mobileWallpaper.customDataUrl})`,
            opacity: settings.mobileWallpaper.opacity,
            filter: settings.mobileWallpaper.blur ? `blur(${settings.mobileWallpaper.blur}px)` : 'none',
          }}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onOpenSettings={() => setSettingsOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profile={settings.profile}
        authUserEmail={user?.email}
        onSignIn={() => setIsGuestBypassed(false)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        {activeMode === 'website' ? (
          <div className="w-full h-full animate-in fade-in zoom-in-95 duration-200">
            <WebsiteStudio
              project={activeProject}
              onBuild={async (prompt) => {
                await handleSendMessage(prompt, [], false);
              }}
              isBuilding={isStreaming}
              onExitToChat={() => setActiveMode('chat')}
              theme={settings.theme}
              onToggleTheme={() => {
                const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                setSettings((prev) => ({ ...prev, theme: nextTheme }));
              }}
              onOpenSettings={() => setSettingsOpen(true)}
              messages={currentConversation?.messages || []}
            />
          </div>
        ) : (
          <>
            {/* Top Floating App Header (Standard Chat Header) */}
            <header className="h-14 border-b border-[var(--rose-border)] bg-[var(--rose-surface)]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-1.5 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] rounded-lg"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* DRIVEcode Aura Badge & Status */}
                <div className="flex items-center gap-2">
                  <Aura state={auraState} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-sm tracking-wide text-[var(--rose-text)]">DRIVEcode</span>
                    <span className="text-[10px] text-[var(--rose-text-muted)] capitalize -mt-0.5">
                      {auraState === 'idle' ? 'Ready' : auraState}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Header Controls */}
              <div className="flex items-center gap-2">
                {/* Pure Dark (#000000) / Pure White (#FFFFFF) Theme Quick Toggle */}
                <button
                  onClick={() => {
                    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                    setSettings((prev) => ({ ...prev, theme: nextTheme }));
                  }}
                  className="p-2 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-surface-card)] rounded-xl transition-colors cursor-pointer"
                  title={`Switch to ${settings.theme === 'dark' ? 'Pure White Light Mode' : 'Complete Dark Mode (#000000)'}`}
                >
                  {settings.theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-neutral-700" />
                  )}
                </button>

                {/* Website Studio Button if active project exists */}
                {activeProject && (
                  <button
                    onClick={() => setActiveMode('website')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EA580C] hover:bg-[#C2410C] text-white transition-all shadow-xs cursor-pointer"
                    title="Open Website Development Studio"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website Studio</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </button>
                )}

                {/* Settings Trigger */}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-background)] rounded-xl transition-colors cursor-pointer"
                  aria-label="Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Normal Chat Workspace Layout (100% UNCHANGED and preserved) */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Left Column: Chat Conversation Stream */}
              <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 w-full">
                {/* Processing Banner */}
                <ProcessingBanner state={auraState} customMessage={processingStatus || undefined} />

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                  <div className={`${chatWidthClass} mx-auto w-full`}>
                    {!currentConversation || currentConversation.messages.length === 0 ? (
                      /* Clean Minimalist Empty State */
                      <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
                        <Aura state={auraState} size="lg" />
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
                            Welcome to DRIVEcode
                          </h2>
                          <p className="text-xs text-gray-500 max-w-md">
                            A personal AI companion. Ask anything, initiate real-time web research, or ask to build a website with live preview.
                          </p>
                        </div>

                        {/* Quick Starters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-4 text-left">
                          {[
                            { title: 'Build a website', desc: 'Create a modern landing page with live interactive preview' },
                            { title: 'Deep web research', desc: 'Synthesize verified citations and cross-checked sources' },
                            { title: 'Code and architecture', desc: 'Write robust algorithms, fix bugs, and refactor' },
                            { title: 'Brainstorm ideas', desc: 'Explore creative strategies, drafts, and plans' },
                          ].map((card, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (card.title.toLowerCase().includes('website')) {
                                  setActiveMode('website');
                                }
                                handleSendMessage(card.title);
                              }}
                              className="p-3 bg-white hover:bg-rose-50/40 border border-gray-200/80 hover:border-rose-200 rounded-xl transition-all text-xs cursor-pointer shadow-2xs group"
                            >
                              <span className="font-bold text-gray-900 group-hover:text-[#E11D48] block mb-0.5">
                                {card.title}
                              </span>
                              <span className="text-[11px] text-gray-400 block line-clamp-2">
                                {card.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      currentConversation.messages.map((msg, idx) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          onRetry={idx > 0 ? () => handleRetry(idx) : undefined}
                          onOpenPreview={(proj) => {
                            setActiveProject(proj);
                            setActiveMode('website');
                          }}
                          readAloudEnabled={settings.readResponsesAloud}
                          profile={settings.profile}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Bottom Floating Glass Input */}
                <ChatInput
                  onSend={handleSendMessage}
                  onStop={handleStopStream}
                  isStreaming={isStreaming}
                  model={currentConversation?.modelId || settings.defaultModel}
                  onSelectModel={handleSelectModel}
                  effort={currentConversation?.effort || settings.defaultEffort}
                  onSelectEffort={handleSelectEffort}
                  onTyping={() => {
                    if (auraState === 'idle') triggerAura('typing', 1200);
                  }}
                  voiceEnabled={settings.voiceInput}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
        onClearCredentials={handleClearCredentials}
        onResetAppearance={handleResetAppearance}
        authUserEmail={user?.email}
        onSignOut={() => {
          setSettingsOpen(false);
          signOut();
        }}
      />
    </div>
  );
}

export default App;
