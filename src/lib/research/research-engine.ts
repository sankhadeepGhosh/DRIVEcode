import { ResearchSource, ResearchData } from '../../types';

export interface WebSearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export class ResearchEngine {
  /**
   * Performs live search via DuckDuckGo HTML or Wikimedia / public search proxy
   */
  static async searchWeb(query: string): Promise<ResearchSource[]> {
    try {
      const resp = await fetch('/api/research/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!resp.ok) {
        throw new Error(`Search request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      return Array.isArray(data.sources) ? data.sources : [];
    } catch (err) {
      console.warn('ResearchEngine search error:', err);
      return [];
    }
  }

  /**
   * Structure a complete research response from collected web sources
   */
  static formatResearchPrompt(query: string, sources: ResearchSource[]): string {
    const sourcesContext = sources.map((s, idx) => `[Source ${idx + 1}] Title: ${s.title} (${s.domain})\nURL: ${s.url}\nExcerpt: ${s.snippet}`).join('\n\n');

    return `You are ROSE in DEEP RESEARCH MODE. The user has requested a comprehensive, fact-grounded investigation into:
"${query}"

Below is real-time web retrieval context gathered from ${sources.length} active web sources:
===================================================
${sourcesContext}
===================================================

Structure your research report strictly following this format:

### Executive Summary
Provide a high-level, clear overview answering the user's primary inquiry.

### Key Findings
- 3 to 5 clear, bulleted factual breakthroughs with bracketed source references (e.g. "[Source 1]").

### Detailed Analysis
Deep, nuanced technical or factual synthesis comparing the findings, identifying underlying trends or data points.

### Evaluated Sources
List the retrieved sources with concise credibility commentary.

### Limitations & Uncertainty
Highlight any gaps in current data, conflicting claims between sources, or areas requiring continued observation.

Be rigorous, clear, objective, and cite sources accurately. Do NOT invent claims not supported by the evidence.`;
  }
}
