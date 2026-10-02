import { AIModelId, AIProvider } from './ai/model-registry';

export interface UsageRecord {
  id: string;
  timestamp: number;
  provider: AIProvider;
  model: AIModelId | string;
  requestType: 'chat' | 'research' | 'website' | 'voice' | 'file';
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  status: 'success' | 'error' | 'aborted';
  errorMessage?: string;
}

export interface AggregatedUsage {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  googleRequests: number;
  googleTokens: number;
  openRouterRequests: number;
  openRouterTokens: number;
  byModel: Record<
    string,
    {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }
  >;
  latestRecords: UsageRecord[];
}

const STORAGE_KEY = 'rose.usage.v1';
const MAX_RECORDS = 500;

export const UsageTracker = {
  getRecords(): UsageRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  record(entry: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
    const record: UsageRecord = {
      id: `usg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      ...entry,
    };

    try {
      const existing = this.getRecords();
      const updated = [record, ...existing].slice(0, MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('UsageTracker: could not persist usage', e);
    }

    return record;
  },

  getAggregated(filterTimeframe: 'today' | '7d' | '30d' | 'all' = 'all'): AggregatedUsage {
    const records = this.getRecords();
    const now = Date.now();
    let cutoff = 0;
    if (filterTimeframe === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      cutoff = d.getTime();
    } else if (filterTimeframe === '7d') {
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (filterTimeframe === '30d') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    const filtered = records.filter((r) => r.timestamp >= cutoff);

    let totalRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let googleRequests = 0;
    let googleTokens = 0;
    let openRouterRequests = 0;
    let openRouterTokens = 0;
    const byModel: Record<string, { requests: number; inputTokens: number; outputTokens: number; totalTokens: number }> = {};

    for (const r of filtered) {
      totalRequests++;
      const inTok = r.inputTokens || 0;
      const outTok = r.outputTokens || 0;
      const totTok = r.totalTokens || inTok + outTok;

      totalInputTokens += inTok;
      totalOutputTokens += outTok;
      totalTokens += totTok;

      if (r.provider === 'google') {
        googleRequests++;
        googleTokens += totTok;
      } else {
        openRouterRequests++;
        openRouterTokens += totTok;
      }

      if (!byModel[r.model]) {
        byModel[r.model] = { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      }
      byModel[r.model].requests++;
      byModel[r.model].inputTokens += inTok;
      byModel[r.model].outputTokens += outTok;
      byModel[r.model].totalTokens += totTok;
    }

    return {
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      googleRequests,
      googleTokens,
      openRouterRequests,
      openRouterTokens,
      byModel,
      latestRecords: filtered.slice(0, 50),
    };
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  exportAsJSON(): string {
    return JSON.stringify(this.getRecords(), null, 2);
  },

  exportAsCSV(): string {
    const records = this.getRecords();
    const headers = ['Timestamp', 'Date', 'Provider', 'Model', 'Type', 'InputTokens', 'OutputTokens', 'TotalTokens', 'DurationMs', 'Status'];
    const rows = records.map((r) => [
      r.timestamp,
      new Date(r.timestamp).toISOString(),
      r.provider,
      r.model,
      r.requestType,
      r.inputTokens ?? 'N/A',
      r.outputTokens ?? 'N/A',
      r.totalTokens ?? 'N/A',
      r.durationMs ?? 'N/A',
      r.status,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },
};
