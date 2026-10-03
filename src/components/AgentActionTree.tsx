import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
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

const PIPELINE_TEMPLATE = [
  {
    id: '1',
    title: 'Analyze Requirements & Layout Architecture',
    description: 'Extract prompt intent, structure components, and select visual design system.',
    priority: 'high',
    tools: ['prompt-analyzer', 'ai-router'],
    subtaskTitle: 'Parse prompt specifications & tokens',
  },
  {
    id: '2',
    title: 'Synthesize Semantic HTML5 & Modern Layout',
    description: 'Construct accessible DOM tree with semantic header, hero, sections, and footer.',
    priority: 'high',
    tools: ['html-generator', 'code-assistant'],
    subtaskTitle: 'Generate semantic HTML5 structure & SVG icons',
  },
  {
    id: '3',
    title: 'Apply Modern Tailwind CSS & Responsive Tokens',
    description: 'Inject Tailwind utility classes, fluid spacing, smooth gradients, and dark/light modes.',
    priority: 'high',
    tools: ['tailwind-engine', 'css-optimizer'],
    subtaskTitle: 'Configure Tailwind CDN and responsive breakpoints',
  },
  {
    id: '4',
    title: 'Inject Interactivity & Client State Handlers',
    description: 'Attach vanilla JavaScript handlers for filters, toggles, calculators, or modals.',
    priority: 'medium',
    tools: ['js-runtime', 'state-manager'],
    subtaskTitle: 'Bind DOM event listeners and local state',
  },
  {
    id: '5',
    title: 'Mount Isolated Live Sandbox & Render',
    description: 'Bundle complete index.html and initialize isolated sandboxed iframe.',
    priority: 'high',
    tools: ['sandbox-runtime', 'preview-engine'],
    subtaskTitle: 'Mount sandbox iframe and verify runtime execution',
  },
];

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

  const hasThought = Boolean(thought && thought.trim());
  const effectiveDuration =
    thoughtDuration ||
    (hasThought ? Math.max(3, Math.min(20, Math.round(thought!.length / 80))) : 0);

  // Compute step-by-step tasks
  const planTasks: Task[] = React.useMemo(() => {
    if (tasks && tasks.length > 0) return tasks;

    if (isStreaming) {
      // Step by step progression during live build:
      // Step 1: 0s-3s in-progress, >=3s completed
      // Step 2: <3s pending, 3s-7s in-progress, >=7s completed
      // Step 3: <7s pending, 7s-11s in-progress, >=11s completed
      // Step 4: <11s pending, 11s-14s in-progress, >=14s completed
      // Step 5: <14s pending, >=14s in-progress
      const startTimes = [0, 3, 7, 11, 14];
      const endTimes = [3, 7, 11, 14, 9999];

      return PIPELINE_TEMPLATE.map((item, idx) => {
        const isCompleted = streamSeconds >= endTimes[idx];
        const isInProgress = streamSeconds >= startTimes[idx] && streamSeconds < endTimes[idx];
        const status = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending';

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          status,
          priority: item.priority,
          level: idx > 1 ? 1 : 0,
          dependencies: idx > 0 ? [String(idx)] : [],
          subtasks: [
            {
              id: `${item.id}.1`,
              title: item.subtaskTitle,
              description: item.description,
              status,
              priority: item.priority,
              tools: item.tools,
            },
          ],
        };
      });
    }

    // When NOT streaming (completed message)
    if (steps && steps.length > 0) {
      return steps.map((step, idx) => {
        const stepStatus = step.status === 'failed' ? 'failed' : 'completed';
        const tools =
          step.type === 'edit'
            ? ['code-editor', 'file-system', 'patch-engine']
            : step.type === 'test'
            ? ['sandbox-runtime', 'preview-engine']
            : step.type === 'read'
            ? ['file-system', 'ast-parser']
            : ['prompt-analyzer', 'ai-router'];

        return {
          id: String(idx + 1),
          title: step.title,
          description: step.detail || (step.fileName ? `Target: ${step.fileName}` : 'Agent orchestrated step'),
          status: stepStatus,
          priority: 'high',
          level: 0,
          dependencies: idx > 0 ? [String(idx)] : [],
          subtasks: [
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
          ],
        };
      });
    }

    // Default completed 5-step pipeline for finished build messages
    return PIPELINE_TEMPLATE.map((item, idx) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: 'completed',
      priority: item.priority,
      level: idx > 1 ? 1 : 0,
      dependencies: idx > 0 ? [String(idx)] : [],
      subtasks: [
        {
          id: `${item.id}.1`,
          title: item.subtaskTitle,
          description: item.description,
          status: 'completed',
          priority: item.priority,
          tools: item.tools,
        },
      ],
    }));
  }, [steps, tasks, isStreaming, streamSeconds]);

  const hasAnyPlan = planTasks.length > 0;
  const completedCount = planTasks.filter((t) => t.status === 'completed').length;

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
                  ? `Active Step · ${streamSeconds}s`
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
