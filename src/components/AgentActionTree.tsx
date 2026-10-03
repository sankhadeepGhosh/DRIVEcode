import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Bot
} from 'lucide-react';
import { AgentActionStep } from '../types';
import Plan, { Task, Subtask } from './ui/agent-plan';

interface AgentActionTreeProps {
  steps?: AgentActionStep[];
  tasks?: Task[];
  thought?: string;
  thoughtDuration?: number;
  isStreaming?: boolean;
  className?: string;
}

export const AgentActionTree: React.FC<AgentActionTreeProps> = ({
  steps = [],
  tasks,
  thought,
  thoughtDuration,
  isStreaming = false,
  className = '',
}) => {
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);

  const hasThought = Boolean(thought && thought.trim());
  const effectiveDuration =
    thoughtDuration ||
    (hasThought ? Math.max(3, Math.min(20, Math.round(thought!.length / 80))) : 0);

  // Map AgentActionSteps or streaming state into rich Task[] structure for the Plan component
  const planTasks: Task[] = React.useMemo(() => {
    if (tasks && tasks.length > 0) return tasks;

    if (steps && steps.length > 0) {
      return steps.map((step, idx) => {
        const stepStatus =
          step.status === 'completed'
            ? 'completed'
            : step.status === 'running'
            ? 'in-progress'
            : step.status === 'failed'
            ? 'failed'
            : isStreaming && idx === steps.length - 1
            ? 'in-progress'
            : 'completed';

        const tools =
          step.type === 'edit'
            ? ['code-editor', 'file-system', 'patch-engine']
            : step.type === 'test'
            ? ['sandbox-runtime', 'preview-engine']
            : step.type === 'read'
            ? ['file-system', 'ast-parser']
            : ['prompt-analyzer', 'ai-router'];

        const subtasks: Subtask[] = [
          {
            id: `${idx + 1}.1`,
            title: step.detail || step.title,
            description: step.fileName
              ? `Target file: ${step.fileName}`
              : (step.detail || 'Autonomous task execution'),
            status: stepStatus,
            priority: 'high',
            tools,
          },
        ];

        return {
          id: String(idx + 1),
          title: step.title,
          description: step.detail || (step.fileName ? `Target: ${step.fileName}` : 'Agent orchestrated step'),
          status: stepStatus,
          priority: 'high',
          level: 0,
          dependencies: idx > 0 ? [String(idx)] : [],
          subtasks,
        };
      });
    }

    if (isStreaming) {
      return [
        {
          id: '1',
          title: 'Analyze Prompt & Resolve Intent',
          description: 'Parsing specifications, context parameters, and routing to specialized agent.',
          status: 'completed',
          priority: 'high',
          level: 0,
          dependencies: [],
          subtasks: [
            {
              id: '1.1',
              title: 'Extract user prompt intent and constraints',
              description: 'Analyze request parameters and context data.',
              status: 'completed',
              priority: 'high',
              tools: ['prompt-analyzer', 'ai-router'],
            },
          ],
        },
        {
          id: '2',
          title: 'Generate Solution & Synthesize Code',
          description: 'Constructing components, layout structure, and verified code.',
          status: 'in-progress',
          priority: 'high',
          level: 0,
          dependencies: ['1'],
          subtasks: [
            {
              id: '2.1',
              title: 'Synthesizing response tokens and semantic code',
              description: 'Streaming structured response with design tokens.',
              status: 'in-progress',
              priority: 'high',
              tools: ['code-editor', 'ai-engine'],
            },
          ],
        },
      ];
    }

    return [];
  }, [steps, tasks, isStreaming]);

  const hasAnyPlan = planTasks.length > 0;

  return (
    <div className={`space-y-2 py-1 w-full ${className}`}>
      {/* 1. Thought for Xs Block */}
      {(hasThought || effectiveDuration > 0) && (
        <div className="text-xs">
          <button
            onClick={() => hasThought && setThoughtOpen(!thoughtOpen)}
            className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer select-none text-[11px] font-mono bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800"
          >
            <Clock className="w-3 h-3 text-[#EA580C]" />
            <span>Thought for {effectiveDuration}s</span>
            {hasThought && (
              thoughtOpen ? <ChevronUp className="w-3 h-3 text-neutral-500" /> : <ChevronDown className="w-3 h-3 text-neutral-500" />
            )}
          </button>

          {/* Expanded Thought Reasoning Content */}
          {hasThought && thoughtOpen && (
            <div className="mt-1.5 ml-2 pl-3 border-l-2 border-[#EA580C]/40 text-[11px] text-neutral-300 font-mono italic leading-relaxed py-2 bg-black/60 rounded-r-xl max-h-56 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text border border-neutral-800">
              {thought}
            </div>
          )}
        </div>
      )}

      {/* 2. Structured Agent Plan Component in Chat */}
      {hasAnyPlan && (
        <div className="w-full rounded-2xl border border-border bg-card/90 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#EA580C]" />
              <span className="text-xs font-semibold text-foreground">
                Agent Execution Steps
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EA580C]/15 text-[#EA580C] font-mono font-medium">
                {isStreaming
                  ? 'In Progress'
                  : `${planTasks.filter((t) => t.status === 'completed').length}/${planTasks.length} Completed`}
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
            <div className="p-2 sm:p-3 overflow-x-hidden">
              <Plan initialTasks={planTasks} title="Agent Action Plan" className="p-0 max-w-full" />
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
