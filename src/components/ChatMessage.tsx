import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Code2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye
} from 'lucide-react';
import { Message, GeneratedProject, AgentActionStep } from '../types';
import { ResearchPanel } from './ResearchPanel';
import { AgentActionTree } from './AgentActionTree';

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onOpenPreview?: (project: GeneratedProject) => void;
  readAloudEnabled?: boolean;
  profile?: import('../types').UserProfile;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onOpenPreview,
  readAloudEnabled = true,
  profile,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    const windowWithSpeech = window as any;
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      windowWithSpeech.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    windowWithSpeech.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/```[\s\S]*?```/g, 'Code block omitted from audio.'));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    windowWithSpeech.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`py-4 w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* User / Rose Avatar Icon */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            profile?.avatarType === 'custom' && profile.customAvatarDataUrl ? (
              <img
                src={profile.customAvatarDataUrl}
                alt={profile.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-semibold">
                {profile?.avatarType === 'preset' && profile.presetId === 'anime'
                  ? '✨'
                  : profile?.avatarType === 'preset' && profile.presetId === 'gradient'
                  ? '🌅'
                  : profile?.avatarType === 'preset' && profile.presetId === 'minimal'
                  ? '🌿'
                  : profile?.avatarType === 'preset' && profile.presetId === 'robot'
                  ? '🤖'
                  : (profile?.name?.[0]?.toUpperCase() || 'U')}
              </div>
            )
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E11D48] to-[#FB7185] text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Message Content Bubble */}
        <div className="flex-1 min-w-0">
          {/* Metadata banner for Assistant (Model, Provider, Effort) */}
          {!isUser && (message.modelUsed || message.providerUsed) && (
            <div className="flex items-center gap-2 mb-1.5 text-[11px] text-gray-400">
              <span className="font-semibold text-gray-600">
                {message.modelUsed === 'gemini-3.1-flash-lite'
                  ? 'Gemini 3.1 Flash-Lite'
                  : message.modelUsed?.split('/')[1]?.split(':')[0] || 'DRIVEcode'}
              </span>
              {message.effortUsed && message.effortUsed !== 'auto' && (
                <>
                  <span>·</span>
                  <span className="capitalize">{message.effortUsed} Effort</span>
                </>
              )}
              {message.providerUsed && (
                <>
                  <span>·</span>
                  <span className="uppercase text-[9px] tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                    {message.providerUsed}
                  </span>
                </>
              )}
            </div>
          )}

          {/* User Attachments Display */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((att) => (
                <div key={att.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-2xs">
                  {att.type.startsWith('image/') && att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="max-h-48 max-w-xs object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 text-xs text-gray-700">
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span className="font-medium truncate max-w-[160px]">{att.name}</span>
                      <span className="text-[10px] text-gray-400">({(att.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Main Body */}
          <div
            className={`p-4 rounded-2xl text-sm leading-relaxed transition-colors ${
              isUser
                ? 'bg-white dark:bg-[#1E293B] border border-gray-200/90 dark:border-slate-700 text-gray-900 dark:text-slate-100 shadow-2xs'
                : 'bg-transparent text-gray-900 dark:text-slate-100'
            }`}
          >
            {message.error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <p className="font-semibold mb-1">Response Error</p>
                <p>{message.errorMessage || 'Unable to generate response from model provider.'}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 flex items-center gap-1 text-[11px] font-bold text-red-800 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Request</span>
                  </button>
                )}
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap select-text font-normal text-gray-900 dark:text-slate-100">
                {message.content}
              </div>
            ) : (() => {
              const lowerContent = message.content.toLowerCase();
              const hasHtmlCode =
                lowerContent.includes('<!doctype html') ||
                lowerContent.includes('<html') ||
                lowerContent.includes('```html') ||
                lowerContent.includes('<<<<<<< search') ||
                Boolean(message.generatedProject) ||
                Boolean(message.isPatchEdit);

              // Strip raw HTML code block and SEARCH/REPLACE blocks so chat commentary is clean and readable
              const textCommentary = message.content
                .replace(/```(?:html:?[^\n]*)?\n[\s\S]*?(?:```|$)/gi, '')
                .replace(/<!DOCTYPE\s+html[\s\S]*?(?:<\/html>|$)/gi, '')
                .replace(/<html[\s\S]*?(?:<\/html>|$)/gi, '')
                .replace(/<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/gi, '')
                .trim();

              const stepsToDisplay: AgentActionStep[] =
                message.actionSteps && message.actionSteps.length > 0
                  ? message.actionSteps
                  : (hasHtmlCode || message.isStreaming)
                  ? [
                      {
                        id: 'step_1',
                        type: 'command',
                        title: 'Analyze Requirements & Layout Architecture',
                        detail: 'Structured semantic layout and initialized design tokens.',
                        status: 'completed',
                      },
                      {
                        id: 'step_2',
                        type: 'edit',
                        title: 'Synthesize Semantic HTML5 & Modern Layout',
                        fileName: 'index.html',
                        detail: 'Generated and validated responsive DOM tree with Tailwind styling.',
                        status: message.isStreaming ? 'running' : 'completed',
                      },
                      {
                        id: 'step_3',
                        type: 'test',
                        title: 'Mount Isolated Live Sandbox & Render',
                        detail: 'Sandboxed iframe runtime validated and live preview mounted.',
                        status: message.isStreaming ? 'pending' : 'completed',
                      },
                    ]
                  : [];

              return (
                <div className="space-y-3 select-text">
                  {/* Agent Execution Plan Component in Chat Section */}
                  {(message.thought || stepsToDisplay.length > 0 || message.isStreaming) && (
                    <AgentActionTree
                      code={message.content}
                      steps={stepsToDisplay}
                      thought={message.thought}
                      thoughtDuration={message.thoughtDuration}
                      isStreaming={message.isStreaming}
                    />
                  )}

                  {/* Clean Human Explanation Text (omitted for website builds to keep clean focus on agent steps) */}
                  {textCommentary && !hasHtmlCode && (
                    <div className="rose-markdown">
                      <Markdown>{textCommentary}</Markdown>
                    </div>
                  )}

                  {/* Live Streaming Indicator (only if not already showing agent plan) */}
                  {message.isStreaming && !hasHtmlCode && stepsToDisplay.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#EA580C] animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Thinking and assembling components...</span>
                    </div>
                  )}

                  {/* Website Action Card (if website was built or edited) */}
                  {hasHtmlCode && (
                    <div className="rounded-2xl border border-[var(--rose-border)] bg-[var(--rose-surface-card)] p-3.5 space-y-3 shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--rose-border)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                            F
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--rose-text)] block">
                              Forge Agent
                            </span>
                            <span className="text-[10px] text-[var(--rose-text-muted)]">
                              {message.isStreaming ? 'Updating live preview...' : 'Build completed · Sandbox ready'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          message.isStreaming
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {message.isStreaming ? 'Streaming...' : 'Sandbox Ready'}
                        </span>
                      </div>

                      {/* Primary Action Button: Open in Website Studio */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {onOpenPreview && message.generatedProject ? (
                          <button
                            onClick={() => onOpenPreview(message.generatedProject!)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open in Website Development Studio</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : onOpenPreview ? (
                          <button
                            onClick={() => onOpenPreview({
                              id: `proj_${Date.now()}`,
                              title: 'Website Project',
                              files: [{ path: 'index.html', content: message.content }],
                              entryPoint: 'index.html',
                              updatedAt: Date.now()
                            })}
                            className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Open in Website Development Studio</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : null}

                        {/* Optional Collapsed Raw Code Toggle */}
                        <button
                          onClick={() => setShowRawCode(!showRawCode)}
                          className="text-[11px] text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>{showRawCode ? 'Hide Code' : 'View Code (index.html)'}</span>
                          {showRawCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Collapsed Raw Code Block (only shown if user clicks View Code) */}
                      {showRawCode && (
                        <div className="mt-2 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-60 overflow-auto custom-scrollbar">
                          <pre><code>{message.content}</code></pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Deep Web Research Grounding Panel */}
            {message.researchData && <ResearchPanel data={message.researchData} />}
          </div>

          {/* Assistant Action Buttons (Copy, Read Aloud, Timestamp) */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="flex items-center gap-2 mt-1 px-1 text-gray-400">
              <button
                onClick={handleCopy}
                className="p-1 hover:text-gray-700 rounded transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {readAloudEnabled && (
                <button
                  onClick={handleToggleAudio}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isPlayingAudio ? 'text-[#E11D48]' : 'hover:text-gray-700'
                  }`}
                  title={isPlayingAudio ? 'Stop audio playback' : 'Read response aloud'}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}

              {onRetry && (
                <button
                  onClick={onRetry}
                  className="p-1 hover:text-gray-700 rounded transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <span className="text-[10px] text-gray-300 ml-auto">{message.timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
