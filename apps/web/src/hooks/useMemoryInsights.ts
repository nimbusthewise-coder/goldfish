/**
 * React hook for memory insights
 * Provides easy access to memory insights based on current context
 */

import { useEffect, useState, useCallback } from 'react';
import { useMemoryStore } from '@/stores/memory-store';
import type { MemoryInsight, MemoryContext } from '@/types/memory';

const DEFAULT_TIME_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface UseMemoryInsightsOptions {
  /** Whether to auto-fetch insights */
  enabled?: boolean;
  /** Time window for context (milliseconds) */
  timeWindow?: number;
  /** Refresh interval (milliseconds) */
  refreshInterval?: number;
  /** Current thought for context */
  currentThought?: string;
  /** Recent thoughts for context */
  recentThoughts?: string[];
  /** Active tags */
  activeTags?: string[];
}

export function useMemoryInsights(options: UseMemoryInsightsOptions = {}) {
  const {
    enabled = true,
    timeWindow = DEFAULT_TIME_WINDOW,
    refreshInterval = 60000, // 1 minute
    currentThought,
    recentThoughts = [],
    activeTags = []
  } = options;

  const [insights, setInsights] = useState<MemoryInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    getInsights,
    dismissInsight,
    markInsightShown,
    insights: storeInsights
  } = useMemoryStore();

  const fetchInsights = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const context: MemoryContext = {
        currentThought,
        recentThoughts,
        activeTags,
        timeWindow
      };

      const newInsights = await getInsights(context);
      setInsights(newInsights);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch memory insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, currentThought, recentThoughts, activeTags, timeWindow, getInsights]);

  // Initial fetch
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchInsights();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchInsights]);

  // Sync with store insights
  useEffect(() => {
    setInsights(storeInsights.filter(i => !i.dismissed));
  }, [storeInsights]);

  const dismiss = useCallback((insightId: string) => {
    dismissInsight(insightId);
    setInsights(prev => prev.filter(i => i.id !== insightId));
  }, [dismissInsight]);

  const markShown = useCallback((insightId: string) => {
    markInsightShown(insightId);
  }, [markInsightShown]);

  // Filter insights by type
  const connectionInsights = insights.filter(i => i.type === 'connection');
  const patternInsights = insights.filter(i => i.type === 'pattern');
  const reminderInsights = insights.filter(i => i.type === 'reminder');
  const suggestionInsights = insights.filter(i => i.type === 'suggestion');

  // Get unshown insights
  const unshownInsights = insights.filter(i => !i.shown);

  return {
    insights,
    connectionInsights,
    patternInsights,
    reminderInsights,
    suggestionInsights,
    unshownInsights,
    isLoading,
    error,
    refresh: fetchInsights,
    dismiss,
    markShown
  };
}

/**
 * Hook for memory statistics
 */
export function useMemoryStats() {
  const getStats = useMemoryStore(state => state.getStats);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getStats]);

  return stats;
}

/**
 * Hook for searching memories
 */
export function useMemorySearch() {
  const searchMemories = useMemoryStore(state => state.searchMemories);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string, options: any = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchMemories({
        query,
        limit: options.limit || 10,
        minConfidence: options.minConfidence || 0.3,
        tags: options.tags,
        timeRange: options.timeRange
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Memory search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchMemories]);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    search,
    clear
  };
}
