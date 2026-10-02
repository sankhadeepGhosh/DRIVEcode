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
  AlertCircle
} from 'lucide-react';
import { GeneratedProject, Message } from '../types';
import { WebsiteBuilder } from '../lib/preview/project-manager';

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
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [promptInput, setPromptInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [fontSerifMode, setFontSerifMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    'A pomodoro timer with ambient gradient',
    'Landing page for a coffee roastery',
    'Snake game with neon style',
    'Todo app with local storage',
  ];

  // Auto-switch to preview on mobile when new project builds
  useEffect(() => {
    if (project && !isBuilding) {
      // Keep mobile preview updated
    }
  }, [project, isBuilding]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = promptInput.trim();
    if (!cleanPrompt || isBuilding) return;

    onBuild(cleanPrompt);
    setPromptInput('');
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
    if (window.innerWidth < 768) {
      setMobileTab('preview');
    }
  };

  const handleCopyCode = () => {
    const code = project?.files?.[0]?.content || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const html = project?.files?.[0]?.content || WebsiteBuilder.generateSandboxHtml(project?.files || []);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project?.title ? `${project.title.toLowerCase().replace(/\s+/g, '-')}.html` : 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const html = WebsiteBuilder.generateSandboxHtml(project?.files || []);
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

  const sandboxHtml = project ? WebsiteBuilder.generateSandboxHtml(project.files) : '';
  const currentCode = project?.files?.[0]?.content || '';

  // Filter messages relevant to website iterations
  const websiteMessages = messages.filter(
    (m) =>
      m.role === 'user' ||
      (m.role === 'assistant' && (m.content.includes('```html') || m.content.includes('Website') || m.generatedProject))
  );

  return (
    <div className={`w-full h-full flex flex-col bg-[var(--rose-background)] text-[var(--rose-text)] transition-colors ${fontSerifMode ? 'font-serif' : 'font-sans'}`}>
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[var(--rose-border)] bg-[var(--rose-background)] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToChat}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-surface-card)] transition-colors cursor-pointer"
            title="Return to standard chat"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Chat</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              F
            </div>
            <span className="font-serif text-lg font-bold tracking-tight text-[var(--rose-text)]">
              Forge
            </span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-[#EA580C]/15 text-[#EA580C] font-semibold uppercase tracking-wider">
              Studio
            </span>
          </div>
        </div>

        {/* Right: Preview/Code Switcher, Theme Toggle, Settings */}
        <div className="flex items-center gap-2">
          {/* Preview / Code Pill Toggle (shown on desktop or when project exists) */}
          <div className="flex items-center bg-[var(--rose-surface-card)] border border-[var(--rose-border)] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => {
                setViewTab('preview');
                setMobileTab('preview');
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewTab === 'preview'
                  ? 'bg-[#EA580C] text-white shadow-2xs font-semibold'
                  : 'text-[var(--rose-text-muted)] hover:text-[var(--rose-text)]'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => {
                setViewTab('code');
                setMobileTab('preview');
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                viewTab === 'code'
                  ? 'bg-[#EA580C] text-white shadow-2xs font-semibold'
                  : 'text-[var(--rose-text-muted)] hover:text-[var(--rose-text)]'
              }`}
            >
              Code
            </button>
          </div>

          {/* Pure Dark / Pure White Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-surface-card)] rounded-xl transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Pure White Light Mode' : 'Complete Dark Mode'}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-surface-card)] rounded-xl transition-colors cursor-pointer"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Body Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Builder Controls & Chat Prompts (Desktop & Mobile Chat Tab) */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col h-full overflow-hidden transition-all duration-200 border-r border-[var(--rose-border)] ${
            mobileTab === 'chat' ? 'w-full md:w-[420px] lg:w-[460px] flex' : 'hidden md:flex md:w-[420px] lg:w-[460px]'
          } shrink-0 bg-[var(--rose-background)]`}
        >
          {/* Scrollable Conversation & Suggestion Area */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">
            {/* Editorial Heading */}
            <div className="space-y-2 pt-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--rose-text)] leading-tight">
                What should we build today?
              </h1>
              <p className="text-xs sm:text-sm text-[var(--rose-text-muted)] leading-relaxed">
                Describe a page, game or tool. Forge writes the code and runs it live.
              </p>
            </div>

            {/* Quick Starters Suggestion Cards */}
            <div className="space-y-2 pt-1">
              {suggestionCards.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCardClick(suggestion)}
                  disabled={isBuilding}
                  className="w-full text-left p-3.5 rounded-2xl bg-[var(--rose-surface-card)] border border-[var(--rose-border)] hover:border-[#EA580C]/60 text-xs sm:text-[13px] text-[var(--rose-text)] hover:text-[#EA580C] font-medium transition-all shadow-2xs hover:shadow-xs group cursor-pointer disabled:opacity-50"
                >
                  <span className="block truncate">{suggestion}</span>
                </button>
              ))}
            </div>

            {/* Recent Iterations / Prompt History */}
            {websiteMessages.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[var(--rose-border)]">
                <span className="text-[11px] font-semibold text-[var(--rose-text-muted)] uppercase tracking-wider block">
                  Project Iterations
                </span>
                {websiteMessages.slice(-6).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs ${
                      msg.role === 'user'
                        ? 'bg-[var(--rose-surface-card)] border border-[var(--rose-border)] text-[var(--rose-text)]'
                        : 'bg-[#EA580C]/10 border border-[#EA580C]/20 text-[var(--rose-text)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-semibold text-[11px]">
                      {msg.role === 'user' ? (
                        <span className="text-[var(--rose-text-muted)]">Prompt</span>
                      ) : (
                        <span className="text-[#EA580C] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Forge
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed line-clamp-3">
                      {msg.role === 'user'
                        ? msg.content
                        : project
                        ? `Compiled "${project.title}" (${project.files.length} file)`
                        : 'Generated code bundle'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* In-Progress Building Banner */}
            {isBuilding && (
              <div className="p-3.5 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center gap-2.5 text-xs text-[#EA580C] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="font-semibold">Forge is crafting your code and rendering live...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Prompt Card (Matches Screenshot!) */}
          <div className="p-4 border-t border-[var(--rose-border)] bg-[var(--rose-background)]">
            <form onSubmit={handleSubmit} className="relative rounded-2xl bg-[var(--rose-surface-card)] border border-[var(--rose-border)] focus-within:border-[#EA580C] transition-all p-3 shadow-sm">
              <textarea
                ref={textareaRef}
                rows={2}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Forge to build..."
                disabled={isBuilding}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-[var(--rose-text)] placeholder:text-[var(--rose-text-muted)] focus:outline-none leading-relaxed pr-16"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[var(--rose-text-muted)]">
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
                    <>
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Live Canvas & Code Inspector (Desktop & Mobile Preview Tab) */}
        {/* ======================================================== */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden relative ${
            mobileTab === 'preview' ? 'w-full flex' : 'hidden md:flex'
          } bg-[var(--rose-background)] p-3 md:p-5`}
        >
          {/* Main Rounded Canvas Area */}
          <div className="flex-1 w-full h-full rounded-2xl md:rounded-3xl border border-[var(--rose-border)] bg-[#050505] relative overflow-hidden flex flex-col shadow-inner">
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
                <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] text-neutral-100 font-mono text-xs overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 shrink-0">
                    <span className="text-neutral-400 font-medium">index.html</span>
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
            ) : (
              /* Centered Empty State (Exact Match to Screenshot!) */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <span className="font-serif text-sm sm:text-base text-neutral-500">
                  Your page will appear here
                </span>
                <p className="text-[11px] text-neutral-600 max-w-xs">
                  Select a starter on the left or type any website idea into the prompt box.
                </p>
              </div>
            )}

            {/* Floating Action Dock (Exact Match to Screenshot!) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="bg-neutral-900/90 backdrop-blur-md text-neutral-300 border border-neutral-700/80 rounded-full px-3.5 py-1.5 flex items-center gap-3.5 shadow-2xl">
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
                  title="Toggle Serif/Sans UI font"
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
      {/* MOBILE BOTTOM NAVIGATION BAR (Exact Match to Image 2!) */}
      {/* ======================================================== */}
      <div className="md:hidden h-14 border-t border-[var(--rose-border)] bg-[var(--rose-background)] px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Chat Tab */}
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            mobileTab === 'chat' ? 'text-[#EA580C]' : 'text-[var(--rose-text-muted)]'
          }`}
        >
          <span>Chat</span>
        </button>

        {/* Center: Action Dock Pill Icons */}
        <div className="bg-[var(--rose-surface-card)] border border-[var(--rose-border)] rounded-full px-3 py-1 flex items-center gap-3">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] transition-colors cursor-pointer"
            title="Expand"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setFontSerifMode(!fontSerifMode)}
            className="p-1 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] transition-colors cursor-pointer"
            title="Font"
          >
            <Type className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setViewTab(viewTab === 'preview' ? 'code' : 'preview');
              setMobileTab('preview');
            }}
            className="p-1 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] transition-colors cursor-pointer"
            title="Code / Preview"
          >
            <PenTool className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setMobileTab('chat');
              textareaRef.current?.focus();
            }}
            className="p-1 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] transition-colors cursor-pointer"
            title="Chat"
          >
            <MessageSquare className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Preview Tab */}
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            mobileTab === 'preview' ? 'text-[#EA580C]' : 'text-[var(--rose-text-muted)]'
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
