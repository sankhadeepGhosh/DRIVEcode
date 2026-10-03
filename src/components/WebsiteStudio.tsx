import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Code2,
  Send,
  Maximize2,
  Minimize2,
  Type,
  PenTool,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  ArrowLeft,
  Sparkles,
  Sliders,
  CheckCircle2,
  Loader2,
  Share2,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { GeneratedProject, Message } from '../types';
import { WebsiteBuilder } from '../lib/preview/project-manager';
import { AgentActionTree } from './AgentActionTree';
import Plan, { Task } from './ui/agent-plan';

interface WebsiteStudioProps {
  project: GeneratedProject | null;
  onBuild: (prompt: string) => Promise<void>;
  isBuilding: boolean;
  onExitToChat: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  messages?: Message[];
}

export const WebsiteStudio: React.FC<WebsiteStudioProps> = ({
  project,
  onBuild,
  isBuilding,
  onExitToChat,
  theme,
  onToggleTheme,
  onOpenSettings,
  messages = [],
}) => {
  const [viewTab, setViewTab] = useState<'preview' | 'code'>('preview');
  const [sideTab, setSideTab] = useState<'details' | 'previewing'>('previewing');
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [promptInput, setPromptInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [fontSerifMode, setFontSerifMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const prevBuildingRef = useRef(isBuilding);

  const suggestionCards = [
    'A pomodoro timer with ambient gradient',
    'Landing page for a coffee roastery',
    'Snake game with neon style',
    'Todo app with local storage',
  ];

  // Live ticking timer while building
  useEffect(() => {
    let interval: any;
    if (isBuilding) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBuilding]);

  // Phone auto-jump: "It jumps to the preview by itself when the page is done."
  useEffect(() => {
    if (prevBuildingRef.current && !isBuilding && project) {
      if (window.innerWidth < 768) {
        setMobileTab('preview');
      }
    }
    prevBuildingRef.current = isBuilding;
  }, [isBuilding, project]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = promptInput.trim();
    if (!cleanPrompt || isBuilding) return;

    onBuild(cleanPrompt);
    setPromptInput('');
    setSideTab('previewing');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Switch to preview tab on mobile when generation starts
    if (window.innerWidth < 768) {
      setMobileTab('preview');
    }
  };

  const handleCardClick = (cardPrompt: string) => {
    if (isBuilding) return;
    onBuild(cardPrompt);
    setSideTab('previewing');
    if (window.innerWidth < 768) {
      setMobileTab('preview');
    }
  };

  const primaryFile =
    project?.files?.find((f) => f.path === 'index.html' || f.path.endsWith('.html')) ||
    project?.files?.[0];
  const sandboxHtml = project ? WebsiteBuilder.generateSandboxHtml(project.files) : '';
  const currentCode = primaryFile?.content || sandboxHtml;

  const handleCopyCode = () => {
    const code = currentCode || sandboxHtml;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = () => {
    const code = sandboxHtml || currentCode;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleDownload = () => {
    const html = sandboxHtml || currentCode;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project?.title ? `${project.title.toLowerCase().replace(/\s+/g, '-')}.html` : 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const html = sandboxHtml || currentCode;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Filter messages relevant to website iterations (including error and streaming states)
  const websiteMessages = messages.filter(
    (m) =>
      m.role === 'user' ||
      (m.role === 'assistant' &&
        (m.content.includes('<!DOCTYPE html') ||
          m.content.includes('```html') ||
          m.generatedProject ||
          m.error ||
          m.isStreaming))
  );

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastErrorMessage = lastAssistantMsg?.error
    ? lastAssistantMsg.errorMessage || 'AI generation failed. Please configure your API key in Settings.'
    : null;

  // Compute active building step based on elapsed time or completion
  const stepProgress = {
    step1: isBuilding ? elapsedSeconds >= 1 : Boolean(project),
    step2: isBuilding ? elapsedSeconds >= 3 : Boolean(project),
    step3: isBuilding ? elapsedSeconds >= 7 : Boolean(project),
    step4: isBuilding ? elapsedSeconds >= 12 : Boolean(project),
    step5: !isBuilding && Boolean(project),
  };

  // Dynamic website generation tasks for the Agent Plan component
  const websiteBuildingTasks: Task[] = [
    {
      id: "1",
      title: "Analyze Requirements & Layout Architecture",
      description: "Extract prompt intent, structure components, and select visual design system.",
      status: elapsedSeconds >= 1 ? (elapsedSeconds >= 4 ? "completed" : "in-progress") : "pending",
      priority: "high",
      level: 0,
      dependencies: [],
      subtasks: [
        {
          id: "1.1",
          title: "Parse prompt specifications",
          description: "Analyze requested layout hierarchy, color scheme, and component requirements.",
          status: elapsedSeconds >= 1 ? "completed" : "in-progress",
          priority: "high",
          tools: ["prompt-analyzer", "ai-router"],
        },
        {
          id: "1.2",
          title: "Define component structure & responsive grid",
          description: "Select font pairing (Inter/Plus Jakarta Sans) and responsive layout tokens.",
          status: elapsedSeconds >= 3 ? "completed" : elapsedSeconds >= 1 ? "in-progress" : "pending",
          priority: "medium",
          tools: ["design-system", "layout-planner"],
        },
      ],
    },
    {
      id: "2",
      title: "Synthesize Semantic HTML5 & Modern Layout",
      description: "Construct accessible DOM tree with semantic header, hero, sections, and footer.",
      status: elapsedSeconds >= 4 ? (elapsedSeconds >= 8 ? "completed" : "in-progress") : "pending",
      priority: "high",
      level: 0,
      dependencies: ["1"],
      subtasks: [
        {
          id: "2.1",
          title: "Generate clean semantic markup",
          description: "Create HTML5 structure with SEO metadata and responsive containers.",
          status: elapsedSeconds >= 6 ? "completed" : elapsedSeconds >= 4 ? "in-progress" : "pending",
          priority: "high",
          tools: ["html-generator", "code-assistant"],
        },
        {
          id: "2.2",
          title: "Add SVGs and Lucide icon vectors",
          description: "Embed crisp SVG icons for visual accents and interactive elements.",
          status: elapsedSeconds >= 8 ? "completed" : elapsedSeconds >= 6 ? "in-progress" : "pending",
          priority: "medium",
          tools: ["icon-library", "vector-engine"],
        },
      ],
    },
    {
      id: "3",
      title: "Apply Modern Tailwind CSS & Responsive Tokens",
      description: "Inject Tailwind utility classes, fluid spacing, smooth gradients, and dark/light modes.",
      status: elapsedSeconds >= 8 ? (elapsedSeconds >= 13 ? "completed" : "in-progress") : "pending",
      priority: "high",
      level: 1,
      dependencies: ["2"],
      subtasks: [
        {
          id: "3.1",
          title: "Configure Tailwind CDN and custom styles",
          description: "Set up utility palette, glassmorphism, animations, and typography.",
          status: elapsedSeconds >= 10 ? "completed" : elapsedSeconds >= 8 ? "in-progress" : "pending",
          priority: "high",
          tools: ["tailwind-engine", "css-optimizer"],
        },
        {
          id: "3.2",
          title: "Verify responsive mobile & tablet breakpoints",
          description: "Ensure layout adapts smoothly from mobile screens to desktop ultrawide.",
          status: elapsedSeconds >= 13 ? "completed" : elapsedSeconds >= 10 ? "in-progress" : "pending",
          priority: "medium",
          tools: ["viewport-simulator"],
        },
      ],
    },
    {
      id: "4",
      title: "Inject Interactivity & Client State Handlers",
      description: "Attach vanilla JavaScript handlers for filters, toggles, calculators, or modals.",
      status: elapsedSeconds >= 13 ? (project ? "completed" : "in-progress") : "pending",
      priority: "medium",
      level: 1,
      dependencies: ["3"],
      subtasks: [
        {
          id: "4.1",
          title: "Bind DOM event listeners and local state",
          description: "Add functional interactivity for buttons, inputs, tabs, and animations.",
          status: elapsedSeconds >= 15 || Boolean(project) ? "completed" : elapsedSeconds >= 13 ? "in-progress" : "pending",
          priority: "high",
          tools: ["js-runtime", "state-manager"],
        },
      ],
    },
    {
      id: "5",
      title: "Mount Isolated Live Sandbox & Render",
      description: "Bundle complete index.html and initialize isolated sandboxed iframe.",
      status: Boolean(project) ? "completed" : elapsedSeconds >= 16 ? "in-progress" : "pending",
      priority: "high",
      level: 1,
      dependencies: ["4"],
      subtasks: [
        {
          id: "5.1",
          title: "Mount sandbox iframe and verify execution",
          description: "Verify console errors and mount live interactive page.",
          status: Boolean(project) ? "completed" : "pending",
          priority: "high",
          tools: ["sandbox-runtime", "preview-engine"],
        },
      ],
    },
  ];

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={`w-full h-full flex flex-col transition-colors ${
        fontSerifMode ? 'font-serif' : 'font-sans'
      } ${
        isDarkMode
          ? 'bg-black text-white'
          : 'bg-white text-black'
      }`}
      style={{
        backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#000000',
      }}
    >
      {/* ======================================================== */}
      {/* TOP HEADER BAR (Exact Lovable / Forge Studio Top Bar) */}
      {/* ======================================================== */}
      <header
        className={`h-14 px-4 flex items-center justify-between shrink-0 z-30 border-b ${
          isDarkMode ? 'border-[#171717] bg-black' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Left: Back to Chat & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border border-[#222222]'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black border border-gray-200'
            }`}
            title="Return to standard chat conversation"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              F
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">
              Forge
            </span>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#EA580C]/15 text-[#EA580C] font-semibold uppercase tracking-wider">
              Studio
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-neutral-400 pl-2">
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="font-medium text-neutral-300">
              {project?.title || 'Prompt Playground'}
            </span>
          </div>
        </div>

        {/* Center: Live Browser Address Bar Preview Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] rounded-full px-3 py-1 text-xs text-neutral-400">
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="hover:text-white transition-colors cursor-pointer p-0.5"
            title="Reload frame"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <span className="text-[11px] text-neutral-300 font-mono px-2">
            {project ? `${project.title.toLowerCase().replace(/\s+/g, '-')}.local` : 'forge.sandbox/app'}
          </span>
          {project && (
            <button
              onClick={handleOpenNewTab}
              className="hover:text-white transition-colors cursor-pointer p-0.5"
              title="Open sandbox in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Preview/Code Switcher, Share, Download, Theme Toggle, Settings */}
        <div className="flex items-center gap-2">
          {/* Preview / Code Pill Toggle (Exact Match to Image 1) */}
          <div
            className={`flex items-center p-0.5 rounded-xl text-xs border ${
              isDarkMode ? 'bg-[#0a0a0a] border-[#222222]' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <button
              onClick={() => {
                setViewTab('preview');
                setMobileTab('preview');
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'preview'
                  ? 'bg-[#EA580C] text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => {
                setViewTab('code');
                setMobileTab('preview');
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'code'
                  ? 'bg-[#EA580C] text-white shadow-2xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          {/* Share Button */}
          {project && (
            <button
              onClick={handleShare}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-[#0a0a0a] hover:bg-[#141414] border-[#222222] text-neutral-300 hover:text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
              title="Copy project sandbox HTML"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedShare ? 'Copied' : 'Share'}</span>
            </button>
          )}

          {/* Download Button */}
          {project && (
            <button
              onClick={handleDownload}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-gray-900 hover:bg-black text-white'
              }`}
              title="Download standalone HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {/* Pure Dark / Pure White Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#0a0a0a] border-[#222222] text-neutral-300 hover:text-white'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black'
            }`}
            title={`Switch to ${isDarkMode ? 'Pure White Light Mode (#FFFFFF)' : 'Pure Black Dark Mode (#000000)'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#0a0a0a] border-[#222222] text-neutral-300 hover:text-white'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:text-black'
            }`}
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN STUDIO WORKSPACE */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Prompt Playground & Progress Checklist (Desktop & Mobile Chat Tab) */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col h-full overflow-hidden transition-all duration-200 border-r ${
            mobileTab === 'chat' ? 'w-full md:w-[440px] lg:w-[480px] flex' : 'hidden md:flex md:w-[440px] lg:w-[480px]'
          } shrink-0 ${isDarkMode ? 'border-[#171717] bg-black' : 'border-gray-200 bg-white'}`}
          style={{ backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}
        >
          {/* Sub-Header: Details vs Previewing Tabs (Exact Match to Image 1) */}
          <div
            className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-[#171717] bg-[#050505]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-400">Mode</span>
              <div
                className={`flex items-center p-0.5 rounded-lg border text-xs ${
                  isDarkMode ? 'bg-[#0a0a0a] border-[#222222]' : 'bg-gray-200 border-gray-300'
                }`}
              >
                <button
                  onClick={() => setSideTab('details')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    sideTab === 'details'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setSideTab('previewing')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    sideTab === 'previewing'
                      ? 'bg-[#EA580C] text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Previewing
                </button>
              </div>
            </div>

            {/* Live Ticking Timer Indicator */}
            {isBuilding ? (
              <div className="flex items-center gap-1.5 text-xs text-[#EA580C] font-mono font-semibold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>{`0:${elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}s`}</span>
              </div>
            ) : project ? (
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready</span>
              </div>
            ) : null}
          </div>

          {/* Scrollable Conversation & Suggestion Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 custom-scrollbar">
            {/* If Previewing Tab is active: Show Progress / Ticking Checklist & Prompts */}
            {sideTab === 'previewing' ? (
              <>
                {/* Editorial Prompt Starters (Image 1 Layout) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                    Quick Website Starters
                  </span>
                  {suggestionCards.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCardClick(suggestion)}
                      disabled={isBuilding}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-[13px] font-medium transition-all shadow-2xs group cursor-pointer disabled:opacity-50 ${
                        isDarkMode
                          ? 'bg-[#080808] border-[#171717] hover:border-[#EA580C]/70 text-neutral-200 hover:text-white'
                          : 'bg-white border-gray-200 hover:border-[#EA580C]/70 text-gray-800'
                      }`}
                    >
                      <span className="block truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>

                {/* Project Iteration History */}
                {websiteMessages.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Build History
                    </span>
                    {websiteMessages.slice(-5).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-xs border space-y-2 ${
                          msg.error
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : msg.role === 'user'
                            ? isDarkMode
                              ? 'bg-[#080808] border-[#171717] text-neutral-300'
                              : 'bg-gray-50 border-gray-200 text-gray-800'
                            : 'bg-[#EA580C]/10 border-[#EA580C]/20 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                          {msg.error ? (
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Generation Error
                            </span>
                          ) : msg.role === 'user' ? (
                            <span className="text-neutral-400">Prompt</span>
                          ) : (
                            <span className="text-[#EA580C] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Forge {msg.isPatchEdit ? 'Patch' : 'Build'}
                            </span>
                          )}
                        </div>

                        {/* Collapsible Action Tree with step-by-step progress */}
                        {msg.role === 'assistant' && !msg.error && (
                          <AgentActionTree
                            steps={msg.actionSteps}
                            tasks={msg.isStreaming || (isBuilding && msg.id === lastAssistantMsg?.id) ? websiteBuildingTasks : undefined}
                            thought={msg.thought}
                            thoughtDuration={msg.thoughtDuration}
                            isStreaming={Boolean(msg.isStreaming || (isBuilding && msg.id === lastAssistantMsg?.id))}
                          />
                        )}

                        {msg.error ? (
                          <div className="space-y-2 pt-0.5">
                            <p className="leading-relaxed text-neutral-300">
                              {msg.errorMessage || 'AI generation failed.'}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={onOpenSettings}
                                className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Configure API Key
                              </button>
                              <button
                                onClick={() => {
                                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                                  if (lastUser) onBuild(lastUser.content);
                                }}
                                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        ) : msg.role === 'user' ? (
                          <p className="leading-relaxed text-neutral-200">
                            {msg.content}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Details Tab (Image 1 Feature) */
              <div className="space-y-4 text-xs text-neutral-300">
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkMode ? 'bg-[#080808] border-[#171717]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#EA580C]" />
                    <span>Project Architecture</span>
                  </h3>
                  <div className="space-y-1.5 text-neutral-400">
                    <p>• <strong>Stack</strong>: HTML5, Tailwind CSS, Vanilla JavaScript</p>
                    <p>• <strong>Runtime</strong>: Sandboxed Client-Side Iframe</p>
                    <p>• <strong>Theme</strong>: Pure Black (#000000) & White (#FFFFFF)</p>
                    <p>• <strong>Status</strong>: {project ? 'Live & Interactive' : 'Awaiting prompt'}</p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border space-y-2 text-neutral-400 leading-relaxed ${
                    isDarkMode ? 'bg-[#080808] border-[#171717]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="font-semibold text-neutral-200">How Forge Works:</p>
                  <p>1. Type any app idea (e.g. &ldquo;pomodoro timer&rdquo; or &ldquo;snake game&rdquo;).</p>
                  <p>2. The AI writes clean, self-contained code without bloating chat.</p>
                  <p>3. The live preview updates automatically in real-time.</p>
                  <p>4. Export standalone .html anytime with one click.</p>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Floating Prompt Card (Exact Lovable / Forge Input Dock) */}
          <div
            className={`p-4 border-t ${
              isDarkMode ? 'border-[#171717] bg-black' : 'border-gray-200 bg-white'
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className={`relative rounded-2xl border focus-within:border-[#EA580C] transition-all p-3 shadow-sm ${
                isDarkMode ? 'bg-[#080808] border-[#222222]' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <textarea
                ref={textareaRef}
                rows={2}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Forge to build..."
                disabled={isBuilding}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none leading-relaxed pr-16"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500">
                  Shift+Enter for newline
                </span>
                <button
                  type="submit"
                  disabled={!promptInput.trim() || isBuilding}
                  className="bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-40 text-white font-semibold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isBuilding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Canvas Live Preview & Code View (Desktop & Mobile Preview Tab) */}
        {/* ======================================================== */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden relative ${
            mobileTab === 'preview' ? 'w-full flex' : 'hidden md:flex'
          } p-3 md:p-4`}
          style={{ backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}
        >
          {/* Main Rounded Canvas Area (Pure Black OLED Container) */}
          <div
            className={`flex-1 w-full h-full rounded-2xl md:rounded-3xl border relative overflow-hidden flex flex-col shadow-inner ${
              isDarkMode ? 'border-[#171717] bg-[#050505]' : 'border-gray-200 bg-gray-100'
            }`}
          >
            {project ? (
              viewTab === 'preview' ? (
                /* Live Interactive Sandboxed Iframe */
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  title="Forge Live Preview"
                  srcDoc={sandboxHtml}
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                  className="w-full h-full border-none bg-white"
                />
              ) : (
                /* Syntax-Highlighted Code Viewer */
                <div className="flex-1 flex flex-col h-full bg-[#050505] text-neutral-100 font-mono text-xs overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800 shrink-0">
                    <span className="text-neutral-400 font-medium">{primaryFile?.path || 'index.html'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  <pre className="flex-1 p-4 overflow-auto custom-scrollbar leading-relaxed text-neutral-300">
                    <code>{currentCode}</code>
                  </pre>
                </div>
              )
            ) : isBuilding ? (
              /* Live Building Canvas State with animated pulse */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center justify-center shadow-lg shadow-[#EA580C]/10 animate-pulse">
                    <Loader2 className="w-8 h-8 text-[#EA580C] animate-spin" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
                    Architecting Your Website...
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    Generating responsive layout, modern Tailwind styles, and live interactive state handlers.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Elapsed: {elapsedSeconds}s</span>
                </div>
              </div>
            ) : lastErrorMessage ? (
              /* Actionable Canvas Error State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-100">
                    Website Generation Paused
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {lastErrorMessage}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={onOpenSettings}
                    className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Open Settings & Add API Key
                  </button>
                  <button
                    onClick={() => {
                      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                      if (lastUser) onBuild(lastUser.content);
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              /* Centered Empty State (Exact Match to Image 1!) */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-200">
                    What should we build today?
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                    Describe a page, game or tool. Forge writes the code and runs it live.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                  {suggestionCards.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCardClick(suggestion)}
                      disabled={isBuilding}
                      className="text-left p-3 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#EA580C]/60 text-xs text-neutral-300 hover:text-white transition-all cursor-pointer shadow-2xs"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <span className="font-serif text-sm text-neutral-600 pt-6">
                  Your page will appear here
                </span>
              </div>
            )}

            {/* Floating Action Dock (Exact Match to Image 1 & 2!) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="bg-[#111111]/90 backdrop-blur-md text-neutral-300 border border-[#2a2a2a] rounded-full px-3.5 py-1.5 flex items-center gap-3.5 shadow-2xl">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setFontSerifMode(!fontSerifMode)}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Toggle Serif/Sans font"
                >
                  <Type className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewTab(viewTab === 'preview' ? 'code' : 'preview')}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title={viewTab === 'preview' ? 'View Code' : 'View Preview'}
                >
                  <PenTool className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setMobileTab('chat');
                    textareaRef.current?.focus();
                  }}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Focus Chat Input"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                {project && (
                  <>
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title="Reload Preview"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleOpenNewTab}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Exact Match to Image 1 & 2!) */}
      {/* ======================================================== */}
      <div
        className={`md:hidden h-14 border-t px-6 flex items-center justify-between shrink-0 z-30 ${
          isDarkMode ? 'border-[#171717] bg-black' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Left: Chat Tab */}
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            mobileTab === 'chat' ? 'text-[#EA580C]' : 'text-neutral-400'
          }`}
        >
          <span>Chat</span>
        </button>

        {/* Center: Action Dock Pill Icons */}
        <div
          className={`border rounded-full px-3 py-1 flex items-center gap-3 ${
            isDarkMode ? 'bg-[#111111] border-[#222222]' : 'bg-gray-100 border-gray-300'
          }`}
        >
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Expand"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setFontSerifMode(!fontSerifMode)}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Font"
          >
            <Type className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setViewTab(viewTab === 'preview' ? 'code' : 'preview');
              setMobileTab('preview');
            }}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Code / Preview"
          >
            <PenTool className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setMobileTab('chat');
              textareaRef.current?.focus();
            }}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Chat"
          >
            <MessageSquare className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Preview Tab */}
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            mobileTab === 'preview' ? 'text-[#EA580C]' : 'text-neutral-400'
          }`}
        >
          <span>Preview</span>
          {project && <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
        </button>
      </div>

      {/* Fullscreen Modal View if active */}
      {isFullscreen && project && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-150">
          <div className="h-10 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-300">
            <span>{project.title} — Fullscreen View</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1 hover:text-white transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <iframe
            title="Fullscreen Preview"
            srcDoc={sandboxHtml}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
            className="w-full flex-1 border-none bg-white"
          />
        </div>
      )}
    </div>
  );
};
