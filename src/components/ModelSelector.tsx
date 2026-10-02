import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check, Cpu } from 'lucide-react';
import { AIModelId, MODEL_LIST } from '../lib/ai/model-registry';

interface ModelSelectorProps {
  selectedModel: AIModelId | 'auto';
  onSelectModel: (model: AIModelId | 'auto') => void;
  className?: string;
  hasOpenRouterKey?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  className = '',
  hasOpenRouterKey = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveLabel = () => {
    if (selectedModel === 'auto') return 'Auto';
    const match = MODEL_LIST.find((m) => m.id === selectedModel);
    return match ? match.label : 'Select Model';
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="btn-model-selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-gray-900 bg-white/90 hover:bg-white border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
        <span className="max-w-[130px] sm:max-w-[180px] truncate">{getActiveLabel()}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 sm:w-80 rounded-xl bg-white border border-gray-200/90 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Select AI Model
            </span>
          </div>

          {/* Auto Route option */}
          <button
            type="button"
            onClick={() => {
              onSelectModel('auto');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
              selectedModel === 'auto' ? 'bg-rose-50/60 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="p-1 rounded-md bg-rose-100/70 text-[#E11D48] mt-0.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">Auto</span>
                {selectedModel === 'auto' && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
              </div>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Automatically routes between Gemini, Nemotron, Laguna & Nex based on your prompt
              </p>
            </div>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Individual Models */}
          {MODEL_LIST.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-rose-50/60 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="p-1 rounded-md bg-gray-100 text-gray-600 mt-0.5 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">{model.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-500 font-medium">
                        {model.badge}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    {model.description}
                  </p>
                </div>
              </button>
            );
          })}

          {!hasOpenRouterKey && (
            <div className="px-3 py-1.5 mt-1 border-t border-gray-100 bg-amber-50/50 text-[10px] text-amber-700">
              Tip: Add OpenRouter key in Settings to unlock all 3 free community models.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
