import React, { useState } from 'react';
import { ExternalLink, Globe, ChevronDown, ChevronUp, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { ResearchData } from '../types';

interface ResearchPanelProps {
  data: ResearchData;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950">Deep Research Sources</h4>
            <div className="flex items-center gap-2 text-[11px] text-amber-800">
              <span>{data.sources.length} sources verified</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{new Date(data.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 rounded-lg transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Hide sources' : 'Show sources'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Source Cards List */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200">
          {data.sources.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white/90 hover:bg-white rounded-xl border border-amber-200/70 hover:border-amber-300 shadow-2xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold mb-1">
                  <span className="uppercase tracking-wider truncate">[Source {idx + 1}] {source.domain}</span>
                  <ExternalLink className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="text-xs font-medium text-gray-900 group-hover:text-amber-900 line-clamp-2 leading-snug">
                  {source.title}
                </div>
              </div>
              {source.snippet && (
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {source.snippet}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
