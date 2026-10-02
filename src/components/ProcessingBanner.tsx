import React from 'react';
import { Loader2, Sparkles, Globe, Hammer, Search, Cpu, CheckCircle2 } from 'lucide-react';
import { AuraState } from '../types';

interface ProcessingBannerProps {
  state: AuraState;
  customMessage?: string;
  sourceCount?: number;
}

export const ProcessingBanner: React.FC<ProcessingBannerProps> = ({
  state,
  customMessage,
  sourceCount,
}) => {
  if (state === 'idle' || state === 'success' || state === 'error') return null;

  const stateConfig: Record<
    string,
    { label: string; icon: React.ReactNode; colorClass: string }
  > = {
    thinking: {
      label: 'Thinking & analyzing context...',
      icon: <Cpu className="w-3.5 h-3.5 animate-spin" />,
      colorClass: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    researching: {
      label: sourceCount ? `Retrieving & cross-checking ${sourceCount} live web sources...` : 'Searching live web & collecting sources...',
      icon: <Globe className="w-3.5 h-3.5 animate-spin" />,
      colorClass: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    building: {
      label: 'Generating components & compiling live preview sandbox...',
      icon: <Hammer className="w-3.5 h-3.5 animate-bounce" />,
      colorClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    uploading: {
      label: 'Uploading and parsing file attachments...',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      colorClass: 'bg-purple-50 text-purple-900 border-purple-200',
    },
    transcribing: {
      label: 'Transcribing speech audio...',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      colorClass: 'bg-rose-50 text-rose-900 border-rose-200',
    },
    streaming: {
      label: 'Streaming response...',
      icon: <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#E11D48]" />,
      colorClass: 'bg-rose-50/60 text-rose-900 border-rose-200/60',
    },
  };

  const config = stateConfig[state] || {
    label: customMessage || 'Processing...',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    colorClass: 'bg-gray-50 text-gray-800 border-gray-200',
  };

  return (
    <div className="px-4 py-2 flex items-center justify-center animate-in fade-in duration-150">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium shadow-2xs ${config.colorClass}`}
      >
        {config.icon}
        <span>{customMessage || config.label}</span>
      </div>
    </div>
  );
};
