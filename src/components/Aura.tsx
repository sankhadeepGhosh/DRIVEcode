import React from 'react';
import { AuraState, ColorPreset } from '../types';
import { DriveCodeLogo } from './ui/DriveCodeLogo';

interface AuraProps {
  state: AuraState;
  size?: 'sm' | 'md' | 'lg';
  preset?: ColorPreset;
  className?: string;
}

export const Aura: React.FC<AuraProps> = ({
  state,
  size = 'md',
  className = '',
}) => {
  const containerSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-16 h-16',
  };

  const logoSizes = {
    sm: 26,
    md: 34,
    lg: 60,
  };

  // State-driven aura ring glow and dynamics matching the cyber neon blue design
  let glowClasses = 'scale-100 opacity-25';
  let pulseSpeed = 'duration-1000';

  switch (state) {
    case 'typing':
      glowClasses = 'scale-110 opacity-50 animate-pulse';
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
      glowClasses = 'scale-100 opacity-30 hover:opacity-50 transition-all';
      break;
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${containerSizes[size]} ${className}`}
    >
      {/* Outer ambient glow ring in neon cyber cyan/blue */}
      <div
        className={`absolute inset-0 rounded-full blur-[8px] pointer-events-none transition-all ${pulseSpeed} ${glowClasses} bg-gradient-to-tr from-[#005dff] via-[#38bdf8] to-[#60a5fa]`}
      />

      {/* Rotating secondary ring for active agent states */}
      {(state === 'streaming' ||
        state === 'listening' ||
        state === 'thinking' ||
        state === 'researching' ||
        state === 'building') && (
        <div
          className="absolute -inset-1 rounded-full border border-sky-400 opacity-60 animate-spin pointer-events-none"
        />
      )}

      {/* Center DRIVEcode Cyber Emblem */}
      <DriveCodeLogo size={logoSizes[size]} animated={state !== 'idle'} />
    </div>
  );
};

