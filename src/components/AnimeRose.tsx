import React from 'react';
import { AuraState, ColorPreset } from '../types';

interface AnimeRoseProps {
  state?: AuraState;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  preset?: ColorPreset;
  className?: string;
}

/**
 * Genuine Anime-Style Rose Emblem
 * Features layered petals, soft magical gradient lighting, and responsive state-driven breathing/glowing.
 */
export const AnimeRose: React.FC<AnimeRoseProps> = ({
  state = 'idle',
  size = 'md',
  preset = 'rose',
  className = '',
}) => {
  const pixelSizes = {
    xs: 20,
    sm: 24,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const px = pixelSizes[size];

  // Accent-specific petal palette mapping
  const palette = {
    rose: {
      outer: '#E11D48',
      mid: '#F43F5E',
      inner: '#FDA4AF',
      glow: '#FB7185',
    },
    ocean: {
      outer: '#0284C7',
      mid: '#0EA5E9',
      inner: '#BAE6FD',
      glow: '#38BDF8',
    },
    forest: {
      outer: '#059669',
      mid: '#10B981',
      inner: '#A7F3D0',
      glow: '#34D399',
    },
    lavender: {
      outer: '#7C3AED',
      mid: '#8B5CF6',
      inner: '#DDD6FE',
      glow: '#A78BFA',
    },
    amber: {
      outer: '#D97706',
      mid: '#F59E0B',
      inner: '#FDE68A',
      glow: '#FBBF24',
    },
    monochrome: {
      outer: '#27272A',
      mid: '#52525B',
      inner: '#E4E4E7',
      glow: '#71717A',
    },
  }[preset] || {
    outer: '#E11D48',
    mid: '#F43F5E',
    inner: '#FDA4AF',
    glow: '#FB7185',
  };

  // State-driven dynamics
  let animClass = 'transition-transform duration-300';
  if (state === 'thinking') animClass = 'animate-pulse scale-105';
  if (state === 'streaming') animClass = 'scale-110';
  if (state === 'researching') animClass = 'animate-spin duration-1000';
  if (state === 'building') animClass = 'scale-105 animate-bounce';
  if (state === 'error') animClass = 'scale-95 opacity-80';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${animClass} ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <radialGradient id={`glow-${preset}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`petal-outer-${preset}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.outer} />
          </linearGradient>
          <linearGradient id={`petal-inner-${preset}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.inner} />
            <stop offset="100%" stopColor={palette.mid} />
          </linearGradient>
        </defs>

        {/* Ambient Magical Glow Ring */}
        <circle cx="50" cy="50" r="48" fill={`url(#glow-${preset})`} />

        {/* Outer Anime Petals */}
        <path
          d="M50 15 C65 15 85 28 85 48 C85 70 65 85 50 85 C35 85 15 70 15 48 C15 28 35 15 50 15 Z"
          fill={`url(#petal-outer-${preset})`}
          opacity="0.95"
        />

        {/* Left Sweeping Anime Petal */}
        <path
          d="M22 45 C20 30 40 22 55 24 C68 26 78 40 72 56 C68 66 52 75 40 70 C30 65 24 58 22 45 Z"
          fill={`url(#petal-outer-${preset})`}
        />

        {/* Right Sweeping Anime Petal */}
        <path
          d="M78 45 C80 30 60 22 45 24 C32 26 22 40 28 56 C32 66 48 75 60 70 C70 65 76 58 78 45 Z"
          fill={`url(#petal-inner-${preset})`}
          opacity="0.9"
        />

        {/* Center Swirling Rose Blossom (Anime Spiraled Core) */}
        <path
          d="M42 34 C47 28 56 29 60 35 C64 42 61 50 54 54 C46 58 38 52 38 45 C38 40 43 36 48 37 C52 38 53 43 50 46 C48 48 44 47 44 44"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />

        {/* Delicate anime highlight speckles */}
        <circle cx="44" cy="32" r="2.2" fill="#FFFFFF" opacity="0.9" />
        <circle cx="62" cy="42" r="1.6" fill="#FFFFFF" opacity="0.75" />
        <circle cx="36" cy="56" r="1.4" fill="#FFFFFF" opacity="0.65" />
      </svg>
    </div>
  );
};
