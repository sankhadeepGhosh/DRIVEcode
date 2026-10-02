import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Gauge, Check } from 'lucide-react';
import { EffortLevel } from '../lib/ai/model-registry';

interface EffortSelectorProps {
  effort: EffortLevel;
  onSelectEffort: (effort: EffortLevel) => void;
  className?: string;
  supportsEffort?: boolean;
}

export const EffortSelector: React.FC<EffortSelectorProps> = ({
  effort,
  onSelectEffort,
  className = '',
  supportsEffort = true,
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

  const options: { id: EffortLevel; label: string; desc: string }[] = [
    { id: 'auto', label: 'Auto', desc: 'Automatic allocation' },
    { id: 'low', label: 'Low', desc: 'Faster execution' },
    { id: 'medium', label: 'Medium', desc: 'Balanced reasoning & speed' },
    { id: 'high', label: 'High', desc: 'Deeper reasoning when supported' },
  ];

  const currentOption = options.find((o) => o.id === effort) || options[2];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="btn-effort-selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-gray-900 bg-white/90 hover:bg-white border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        title="AI Reasoning Effort"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Gauge className="w-3.5 h-3.5 text-gray-500" />
        <span className="hidden sm:inline text-gray-500">Effort:</span>
        <span className="font-semibold text-gray-800">{currentOption.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-gray-200/90 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Reasoning Effort
            </span>
          </div>

          {options.map((opt) => {
            const isSelected = effort === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectEffort(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected ? 'bg-rose-50/60 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-gray-800">{opt.label}</div>
                  <div className="text-[11px] text-gray-400">{opt.desc}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
              </button>
            );
          })}

          {!supportsEffort && (
            <div className="px-3 py-1.5 mt-1 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-500">
              Note: This model does not expose adjustable reasoning effort.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
