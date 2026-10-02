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
  Code2
} from 'lucide-react';
import { Message, GeneratedProject } from '../types';
import { ResearchPanel } from './ResearchPanel';

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
                  : message.modelUsed?.split('/')[1]?.split(':')[0] || 'ROSE'}
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
            ) : (
              <div className="rose-markdown select-text">
                <Markdown>{message.content}</Markdown>
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-[#E11D48] animate-pulse align-middle" />
                )}
              </div>
            )}

            {/* Generated Website Interactive Project Card */}
            {message.generatedProject && onOpenPreview && (
              <div className="mt-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-gray-900">
                      {message.generatedProject.title || 'Generated Website Project'}
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      {message.generatedProject.files.length} files compiled · Live sandbox ready
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenPreview(message.generatedProject!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D48] text-white rounded-lg text-xs font-semibold hover:bg-[#BE123C] transition-all cursor-pointer"
                >
                  <span>Open Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

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
