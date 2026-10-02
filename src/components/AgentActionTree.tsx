import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  Eye,
  Check
} from 'lucide-react';
import { AgentActionStep } from '../types';

interface AgentActionTreeProps {
  steps?: AgentActionStep[];
  thought?: string;
  thoughtDuration?: number;
  className?: string;
}

export const AgentActionTree: React.FC<AgentActionTreeProps> = ({
  steps = [],
  thought,
  thoughtDuration,
  className = '',
}) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [thoughtOpen, setThoughtOpen] = useState(false);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasThought = Boolean(thought && thought.trim());
  const effectiveDuration = thoughtDuration || (hasThought ? Math.max(3, Math.min(20, Math.round(thought!.length / 80))) : 0);

  return (
    <div className={`space-y-1.5 py-1 ${className}`}>
      {/* 1. Thought for Xs Block (Exact Match to User Image!) */}
      {(hasThought || effectiveDuration > 0) && (
        <div className="text-xs">
          <button
            onClick={() => hasThought && setThoughtOpen(!thoughtOpen)}
            className={`flex items-center gap-1.5 py-1 px-2 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer select-none text-[11px] font-mono`}
          >
            <Clock className="w-3 h-3 text-neutral-500" />
            <span>Thought for {effectiveDuration}s</span>
            {hasThought && (
              thoughtOpen ? <ChevronUp className="w-3 h-3 text-neutral-500" /> : <ChevronDown className="w-3 h-3 text-neutral-500" />
            )}
          </button>

          {/* Expanded Thought Reasoning Content */}
          {hasThought && thoughtOpen && (
            <div className="mt-1 ml-2 pl-3 border-l-2 border-neutral-800 text-[11px] text-neutral-400 font-mono italic leading-relaxed py-1 bg-black/40 rounded-r-lg max-h-56 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text">
              {thought}
            </div>
          )}
        </div>
      )}

      {/* 2. Structured Action Steps Stream (Exact Match to User Image!) */}
      {steps.map((step) => {
        const isOpen = Boolean(openItems[step.id]);

        return (
          <div key={step.id} className="text-xs font-sans group">
            {/* Step Header Row */}
            <button
              onClick={() => toggleItem(step.id)}
              className="w-full flex items-center justify-between py-1 px-2 rounded-lg text-left text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {/* Step Type Icon */}
                {step.type === 'edit' ? (
                  <FileCode className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-400 shrink-0" />
                ) : step.type === 'read' ? (
                  <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-400 shrink-0" />
                ) : step.type === 'test' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 shrink-0" />
                )}

                {/* Title & Filename */}
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-neutral-200 truncate">
                    {step.title}
                  </span>
                  {step.fileName && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono shrink-0">
                      {step.fileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Expand/Collapse Chevron */}
              <div className="text-neutral-500 group-hover:text-neutral-300 shrink-0">
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Expanded Step Details */}
            {isOpen && (
              <div className="mt-1 mb-2 ml-5 mr-1 p-3 rounded-xl bg-black border border-neutral-800 space-y-2 text-xs animate-in fade-in duration-150">
                {step.detail && (
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    {step.detail}
                  </p>
                )}

                {/* If Diff Available (for surgical file edits) */}
                {step.diff && (
                  <div className="space-y-1.5 font-mono text-[11px] overflow-hidden rounded-lg border border-neutral-800 bg-[#050505]">
                    {/* Header */}
                    <div className="px-2.5 py-1 bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                      <span>Diff · {step.fileName || 'index.html'}</span>
                      <span className="text-emerald-400 font-semibold">Surgical Patch</span>
                    </div>

                    {/* Removed lines */}
                    {step.diff.search && (
                      <div className="p-2 bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 overflow-x-auto custom-scrollbar">
                        <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 select-none">
                          - Removed
                        </div>
                        <pre className="whitespace-pre"><code>{step.diff.search}</code></pre>
                      </div>
                    )}

                    {/* Added lines */}
                    {step.diff.replace && (
                      <div className="p-2 bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 overflow-x-auto custom-scrollbar">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 select-none">
                          + Added
                        </div>
                        <pre className="whitespace-pre"><code>{step.diff.replace}</code></pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
