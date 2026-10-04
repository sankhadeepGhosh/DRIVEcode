import React from 'react';
import { Lightbulb, PenTool, Code2, Compass } from 'lucide-react';
import { DriveCodeLogo } from './ui/DriveCodeLogo';
import { AuraState } from '../types';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  auraState: AuraState;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt, auraState }) => {
  const suggestions = [
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
      title: 'Brainstorm ideas',
      desc: 'Unique features for a habit tracking web app',
      prompt: 'Give me 5 creative and practical feature ideas for a habit-tracking app that goes beyond basic streaks.'
    },
    {
      icon: <PenTool className="w-4 h-4 text-sky-500" />,
      title: 'Draft a message',
      desc: 'A polite, confident follow-up email after an interview',
      prompt: 'Help me draft a concise, warm, and professional follow-up email after a second-round interview for a product role.'
    },
    {
      icon: <Code2 className="w-4 h-4 text-indigo-500" />,
      title: 'Explain code',
      desc: 'How React Server Components work in plain English',
      prompt: 'Explain how React Server Components (RSC) work under the hood using an everyday analogy and key advantages.'
    },
    {
      icon: <Compass className="w-4 h-4 text-teal-500" />,
      title: 'Plan a trip',
      desc: 'A relaxed 3-day walking itinerary for Kyoto',
      prompt: 'Design a relaxed 3-day itinerary for Kyoto focusing on historic gardens, artisan coffee, and hidden culinary spots.'
    }
  ];

  return (
    <div id="welcome-screen" className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 max-w-3xl mx-auto text-center select-none">
      {/* DRIVEcode Cyber Emblem with Responsive Animation */}
      <div className="mb-5">
        <DriveCodeLogo size={68} animated={auraState !== 'idle'} />
      </div>

      {/* Greeting Headline */}
      <h1 className="font-serif text-3xl sm:text-4xl text-[var(--rose-text,#09090B)] dark:text-white font-normal tracking-tight mb-2">
        Good day, how can I help?
      </h1>
      <p className="text-sm sm:text-base text-[var(--rose-text-muted,#71717A)] dark:text-gray-400 max-w-md mb-8 font-normal leading-relaxed">
        I’m <span className="font-semibold text-sky-500 dark:text-sky-400">DRIVEcode</span>, your thoughtful multi-model AI companion. Ask questions, explore concepts, or draft anything on your mind.
      </p>

      {/* Suggestion Starter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-3.5 rounded-xl bg-[var(--rose-surface-card,#FFFFFF)] dark:bg-[#111111] hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-[var(--rose-border,#E5E7EB)] dark:border-[#222222] hover:border-sky-400/60 dark:hover:border-sky-500/50 shadow-xs hover:shadow-sm transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-colors shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm text-[var(--rose-text,#09090B)] dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--rose-text-muted,#71717A)] dark:text-gray-400 line-clamp-1 mt-0.5">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

