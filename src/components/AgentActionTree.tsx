import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Bot
} from 'lucide-react';
import { AgentActionStep } from '../types';
import Plan, { Task } from './ui/agent-plan';
import { AgentPlanAnalyzer } from '../lib/preview/plan-analyzer';

interface AgentActionTreeProps {
  steps?: AgentActionStep[];
  tasks?: Task[];
  prompt?: string;
  code?: string;
  fileName?: string;
  thought?: string;
  thoughtDuration?: number;
  isStreaming?: boolean;
  elapsedSeconds?: number;
  className?: string;
}

export const AgentActionTree: React.FC<AgentActionTreeProps> = ({
  steps = [],
  tasks,
  prompt,
  code,
  fileName = 'index.html',
  thought,
  thoughtDuration,
  isStreaming = false,
  elapsedSeconds,
  className = '',
}) => {
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);
  const [streamSeconds, setStreamSeconds] = useState(0);

  // Smooth live ticking while streaming to drive step-by-step execution
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      setStreamSeconds(0);
      interval = setInterval(() => {
        setStreamSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const activeElapsed = elapsedSeconds !== undefined ? elapsedSeconds : streamSeconds;

  const hasThought = Boolean(thought && thought.trim());
  const effectiveDuration =
    thoughtDuration ||
    (hasThought ? Math.max(3, Math.min(20, Math.round(thought!.length / 80))) : 0);

  // Compute accurate, prompt-specific and code-specific step-by-step tasks
  const planTasks: Task[] = React.useMemo(() => {
    if (tasks && tasks.length > 0) return tasks;

    return AgentPlanAnalyzer.generateAccurateTasks({
      prompt: prompt || 'Build a modern interactive web application',
      code: code || '',
      isStreaming,
      elapsedSeconds: activeElapsed,
      fileName,
    });
  }, [tasks, prompt, code, isStreaming, activeElapsed, fileName]);

  const hasAnyPlan = planTasks.length > 0;
  const completedCount = planTasks.filter((t) => t.status === 'completed').length;

  return (
    <div className={`space-y-2 py-1 w-full ${className}`}>
      {/* 1. Thought for Xs Block */}
      {(hasThought || effectiveDuration > 0) && (
        <div className="text-xs">
          <button
            onClick={() => hasThought && setThoughtOpen(!thoughtOpen)}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none text-[11px] font-mono bg-muted/60 hover:bg-muted border border-border"
          >
            <Clock className="w-3 h-3 text-[#EA580C]" />
            <span>Thought for {effectiveDuration}s</span>
            {hasThought && (
              thoughtOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </button>

          {/* Expanded Thought Reasoning Content */}
          {hasThought && thoughtOpen && (
            <div className="mt-1.5 ml-2 pl-3 border-l-2 border-[#EA580C]/40 text-[11px] text-foreground font-mono italic leading-relaxed py-2 bg-card/90 rounded-r-xl max-h-56 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text border border-border">
              {thought}
            </div>
          )}
        </div>
      )}

      {/* 2. Structured Agent Plan Component in Chat */}
      {hasAnyPlan && (
        <div className="w-full rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#EA580C]" />
              <span className="text-xs font-semibold text-foreground">
                Agent Execution Steps
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EA580C]/15 text-[#EA580C] font-mono font-medium">
                {isStreaming
                  ? `Active Step · ${activeElapsed}s`
                  : `${completedCount}/${planTasks.length} Completed`}
              </span>
            </div>
            <button
              onClick={() => setPlanOpen(!planOpen)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{planOpen ? 'Collapse' : 'Expand'}</span>
              {planOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {planOpen && (
            <div className="p-1 sm:p-2 overflow-x-hidden">
              <Plan initialTasks={planTasks} title="Agent Action Plan" className="p-0 max-w-full border-none shadow-none" />
            </div>
          )}
        </div>
      )}

      {/* 3. Surgical Patch Diff Blocks (if available) */}
      {steps.some((s) => s.diff) && (
        <div className="space-y-2 pt-1">
          {steps
            .filter((s) => s.diff)
            .map((step) => (
              <div
                key={`diff-${step.id}`}
                className="space-y-1.5 font-mono text-[11px] overflow-hidden rounded-lg border border-neutral-800 bg-[#050505]"
              >
                <div className="px-2.5 py-1 bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                  <span>Diff · {step.fileName || 'index.html'}</span>
                  <span className="text-emerald-400 font-semibold">Surgical Patch</span>
                </div>
                {step.diff?.search && (
                  <div className="p-2 bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 overflow-x-auto custom-scrollbar">
                    <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 select-none">
                      - Removed
                    </div>
                    <pre className="whitespace-pre">
                      <code>{step.diff.search}</code>
                    </pre>
                  </div>
                )}
                {step.diff?.replace && (
                  <div className="p-2 bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 overflow-x-auto custom-scrollbar">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 select-none">
                      + Added
                    </div>
                    <pre className="whitespace-pre">
                      <code>{step.diff.replace}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
