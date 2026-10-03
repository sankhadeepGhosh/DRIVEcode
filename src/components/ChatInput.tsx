import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Paperclip,
  Globe,
  SlidersHorizontal,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { AIModelId, EffortLevel, MessageAttachment } from '../types';
import { AI_MODELS, MODEL_LIST } from '../lib/ai/model-registry';
import { FileParser } from '../lib/attachments/file-parser';

interface ChatInputProps {
  onSend: (text: string, attachments?: MessageAttachment[], isResearchMode?: boolean) => void;
  onStop: () => void;
  isStreaming: boolean;
  model: AIModelId | 'auto';
  onSelectModel: (m: AIModelId | 'auto') => void;
  effort: EffortLevel;
  onSelectEffort: (e: EffortLevel) => void;
  onTyping: () => void;
  voiceEnabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isStreaming,
  model,
  onSelectModel,
  effort,
  onSelectEffort,
  onTyping,
  voiceEnabled = true,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isResearchActive, setIsResearchActive] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;
    onSend(text, attachments, isResearchActive);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Attachments handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const parsed = await FileParser.parseFile(files[i]);
        setAttachments((prev) => [...prev, parsed]);
      } catch (err: any) {
        alert(err?.message || 'Error processing attachment');
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice recording toggle using Web Speech API
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        onTyping();
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const getModelLabel = () => {
    if (model === 'auto') return 'Auto (Smart Route)';
    if (model === 'nvidia/nemotron-3-ultra-550b-a55b:free') return 'Nemotron 3 Ultra';
    if (model === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
    if (model === 'gemini-3.1-flash-lite') return 'Gemini 3.1 Flash-Lite';
    if (model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free') return 'Nemotron Omni';
    if (model === 'nvidia/nemotron-3.5-lightning:free') return 'Nemotron 3.5';
    if (model === 'poolside/laguna-s-2.1:free') return 'Laguna S 2.1';
    if (model === 'nex-agi/nex-n2.5-pro:free') return 'Nex-N2.5-Pro';
    return model;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
      {/* Attachments Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white/80 rounded-xl border border-gray-200/80 shadow-2xs">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-800 font-medium"
            >
              {att.type.startsWith('image/') ? (
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className="truncate max-w-[140px]">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Glass Input Bar */}
      <div className="bg-[var(--rose-surface)] rounded-2xl border border-[var(--rose-border)] shadow-sm focus-within:border-[var(--rose-accent)] transition-all">
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isResearchActive
                ? 'Ask anything for real-time web research & citation...'
                : 'Message DRIVEcode or ask to build a website...'
            }
            className="w-full resize-none bg-transparent text-base sm:text-sm text-[var(--rose-text)] placeholder:text-[var(--rose-text-muted)] focus:outline-none max-h-40 leading-relaxed"
          />
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-2 border-t border-[var(--rose-border)]">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1">
            {/* File Attachment Trigger */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-background)] rounded-lg transition-colors cursor-pointer"
              title="Attach files, datasets, images or media"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Deep Research Toggle Button */}
            <button
              type="button"
              onClick={() => setIsResearchActive(!isResearchActive)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isResearchActive
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-background)]'
              }`}
              title="Toggle Deep Web Research mode"
            >
              <Globe
                className={`w-3.5 h-3.5 ${isResearchActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--rose-text-muted)]'}`}
              />
              <span className="hidden sm:inline">Deep Research</span>
            </button>

            {/* Model & Effort Selector Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] hover:bg-[var(--rose-background)] rounded-lg transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--rose-text-muted)] shrink-0" />
                <span className="truncate max-w-[90px] sm:max-w-[120px]">{getModelLabel()}</span>
              </button>

              {/* Model / Effort Dropdown */}
              {showModelPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-[calc(100vw-36px)] max-w-xs sm:w-72 bg-[var(--rose-surface)] text-[var(--rose-text)] rounded-2xl shadow-xl border border-[var(--rose-border)] p-2.5 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95">
                  <div className="font-semibold text-gray-800 uppercase tracking-wider text-[10px] px-1">
                    Select Model
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        onSelectModel('auto');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'auto'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Auto (Smart Route)</span>
                      <span className="text-[10px] text-gray-400">Intelligent</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('nvidia/nemotron-3-ultra-550b-a55b:free');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'nvidia/nemotron-3-ultra-550b-a55b:free'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Nemotron 3 Ultra</span>
                      <span className="text-[10px] text-gray-400">550B MoE/Free</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('gemini-3.8-flash');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'gemini-3.8-flash'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Gemini 3.8 Flash</span>
                      <span className="text-[10px] text-gray-400">Google Primary</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('gemini-3.1-flash-lite');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'gemini-3.1-flash-lite'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Gemini 3.1 Flash-Lite</span>
                      <span className="text-[10px] text-gray-400">Google Fast</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Nemotron Omni</span>
                      <span className="text-[10px] text-gray-400">Multimodal/Free</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('nvidia/nemotron-3.5-lightning:free');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'nvidia/nemotron-3.5-lightning:free'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Nemotron 3.5</span>
                      <span className="text-[10px] text-gray-400">Structured/Free</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('poolside/laguna-s-2.1:free');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'poolside/laguna-s-2.1:free'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Laguna S 2.1</span>
                      <span className="text-[10px] text-gray-400">Code/Free</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectModel('nex-agi/nex-n2.5-pro:free');
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        model === 'nex-agi/nex-n2.5-pro:free'
                          ? 'bg-rose-50 text-[#E11D48] font-bold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Nex-N2.5-Pro</span>
                      <span className="text-[10px] text-gray-400">UI/Web/Free</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="font-semibold text-gray-800 uppercase tracking-wider text-[10px] px-1 mb-1">
                      Reasoning Effort
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['auto', 'low', 'medium', 'high'] as EffortLevel[]).map((eff) => (
                        <button
                          key={eff}
                          onClick={() => {
                            onSelectEffort(eff);
                            setShowModelPicker(false);
                          }}
                          className={`py-1 text-[11px] rounded-md font-medium capitalize text-center transition-colors cursor-pointer ${
                            effort === eff
                              ? 'bg-[#E11D48] text-white font-bold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {eff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Voice Input Button */}
            {voiceEnabled && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={isRecording ? 'Listening... click to stop' : 'Dictate with voice'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all cursor-pointer shadow-xs"
                title="Stop generation"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  text.trim() || attachments.length > 0
                    ? 'bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
