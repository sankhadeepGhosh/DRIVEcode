import React from 'react';

export interface DriveCodeLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export const DriveCodeLogo: React.FC<DriveCodeLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  animated = false,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Orbital Neon AI Mark matching the ai-loader prompt design */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-full select-none"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Ambient Back-Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#005dff] via-[#38bdf8] to-[#60a5fa] blur-[6px] opacity-70" />

        {/* Outer Rotating Glowing Ring */}
        <div
          className={`absolute inset-0 rounded-full border border-sky-400/40 ${
            animated ? 'animate-spin' : ''
          }`}
          style={{
            boxShadow:
              '0 0 10px 1px rgba(56, 189, 248, 0.4) inset, 0 0 6px 1px rgba(0, 93, 255, 0.3)',
            animationDuration: '10s',
          }}
        />

        {/* Inner Cyber Core */}
        <div className="relative w-[78%] h-[78%] rounded-full bg-gradient-to-br from-[#0f172a] via-[#1a3379] to-[#0284c7] flex items-center justify-center border border-sky-300/30 shadow-inner">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-[58%] h-[58%] text-sky-100 drop-shadow-[0_0_5px_rgba(56,189,248,0.9)]"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Geometric Futuristic 'D' with glowing neural aperture */}
            <path d="M5 4h6a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H5V4z" />
            <circle cx="11.5" cy="12" r="2.2" fill="#38bdf8" stroke="none" />
          </svg>
        </div>
      </div>

      {showText && (
        <span className="font-serif font-bold tracking-wider text-base text-[var(--rose-text,#09090B)] dark:text-white">
          DRIVE<span className="text-sky-500 font-sans font-semibold">code</span>
        </span>
      )}
    </div>
  );
};

export default DriveCodeLogo;
