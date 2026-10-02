import React from 'react';
import { Globe, Hammer, Zap, Activity } from 'lucide-react';
import { AuraState, ColorPreset } from '../types';
import { AnimeRose } from './AnimeRose';

interface AuraProps {
  state: AuraState;
  size?: 'sm' | 'md' | 'lg';
  preset?: ColorPreset;
  className?: string;
}

export const Aura: React.FC<AuraProps> = ({
  state,
  size = 'md',
  preset = 'rose',
  className = '',
}) => {
  const containerSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-16 h-16',
  };

  const roseSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'xl' as const,
  };

  // State-driven aura ring glow and dynamics
  let glowClasses = 'scale-100 opacity-20';
  let pulseSpeed = 'duration-1000';

  switch (state) {
    case 'typing':
      glowClasses = 'scale-110 opacity-40 animate-pulse';
      pulseSpeed = 'duration-700';
      break;
    case 'listening':
      glowClasses = 'scale-135 opacity-70 animate-ping';
      pulseSpeed = 'duration-500';
      break;
    case 'researching':
      glowClasses = 'scale-130 opacity-60 animate-spin';
      pulseSpeed = 'duration-800';
      break;
    case 'building':
      glowClasses = 'scale-130 opacity-70 animate-pulse';
      pulseSpeed = 'duration-600';
      break;
    case 'thinking':
      glowClasses = 'scale-125 opacity-55 animate-pulse';
      pulseSpeed = 'duration-600';
      break;
    case 'streaming':
      glowClasses = 'scale-120 opacity-65 animate-pulse';
      pulseSpeed = 'duration-500';
      break;
    case 'uploading':
    case 'reading':
      glowClasses = 'scale-115 opacity-50 animate-pulse';
      pulseSpeed = 'duration-700';
      break;
    case 'success':
      glowClasses = 'scale-125 opacity-80 transition-transform duration-300';
      break;
    case 'error':
      glowClasses = 'scale-115 opacity-80 animate-bounce';
      break;
    case 'idle':
    default:
      glowClasses = 'scale-100 opacity-25 hover:opacity-40 transition-all';
      break;
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${containerSizes[size]} ${className}`}
    >
      {/* Outer ambient glow ring tinted by theme */}
      <div
        className={`absolute inset-0 rounded-full blur-[7px] pointer-events-none transition-all ${pulseSpeed} ${glowClasses}`}
        style={{
          backgroundColor:
            preset === 'ocean'
              ? '#38BDF8'
              : preset === 'forest'
              ? '#34D399'
              : preset === 'lavender'
              ? '#A78BFA'
              : preset === 'amber'
              ? '#FBBF24'
              : preset === 'monochrome'
              ? '#71717A'
              : '#FB7185',
        }}
      />

      {/* Rotating secondary ring for active agent states */}
      {(state === 'streaming' ||
        state === 'listening' ||
        state === 'thinking' ||
        state === 'researching' ||
        state === 'building') && (
        <div
          className="absolute -inset-1 rounded-full border border-current opacity-40 animate-spin pointer-events-none"
          style={{ color: 'var(--rose-accent)' }}
        />
      )}

      {/* Center Original Anime Rose Artwork */}
      <AnimeRose state={state} size={roseSizes[size]} preset={preset} />
    </div>
  );
};
