/**
 * Extended state management for wonder detection analysis
 * Works alongside the main thoughts store to add analysis capabilities
 */

import { create } from 'zustand';
import type { Thought, WonderAnalysis, AnalysisPerformanceMetrics } from '../types/thought';

interface WonderDetectionStore {
  /** Analysis cache to avoid reprocessing */
  analysisCache: Map<string, WonderAnalysis>;
  
  /** Performance metrics */
  metrics: AnalysisPerformanceMetrics;
  
  /** Get all thoughts with curiosity moments */
  getCuriosityMoments: (thoughts: Thought[], minConfidence?: number) => Thought[];
  
  /** Cache analysis result */
  cacheAnalysis: (thoughtId: string, analysis: WonderAnalysis) => void;
  
  /** Get cached analysis */
  getCachedAnalysis: (thoughtId: string) => WonderAnalysis | undefined;
  
  /** Clear analysis cache */
  clearCache: () => void;
  
  /** Update performance metrics */
  updateMetrics: (processingTime: number, cached: boolean) => void;
  
  /** Reset all state */
  reset: () => void;
}

const initialMetrics: AnalysisPerformanceMetrics = {
  averageTime: 0,
  maxTime: 0,
  minTime: Infinity,
  totalAnalyses: 0,
  cacheHits: 0,
  cacheHitRate: 0,
};

export const useThoughtStore = create<WonderDetectionStore>((set, get) => ({
  analysisCache: new Map(),
  metrics: initialMetrics,

  getCuriosityMoments: (thoughts: Thought[], minConfidence = 0.5) => {
    return thoughts.filter(
      (thought) =>
        thought.analysis &&
        thought.analysis.confidence >= minConfidence &&
        thought.analysis.isCuriosityMoment
    );
  },

  cacheAnalysis: (thoughtId, analysis) => {
    set((state) => {
      const newCache = new Map(state.analysisCache);
      newCache.set(thoughtId, analysis);
      return { analysisCache: newCache };
    });
  },

  getCachedAnalysis: (thoughtId) => {
    return get().analysisCache.get(thoughtId);
  },

  clearCache: () => {
    set({ analysisCache: new Map() });
  },

  updateMetrics: (processingTime, cached) => {
    set((state) => {
      const { metrics } = state;
      const totalAnalyses = metrics.totalAnalyses + 1;
      const cacheHits = cached ? metrics.cacheHits + 1 : metrics.cacheHits;

      // Update min/max only for non-cached analyses
      let minTime = metrics.minTime;
      let maxTime = metrics.maxTime;
      if (!cached) {
        minTime = Math.min(minTime, processingTime);
        maxTime = Math.max(maxTime, processingTime);
      }

      // Update average (excluding cached results for more accurate timing)
      const nonCachedCount = totalAnalyses - cacheHits;
      const averageTime =
        nonCachedCount > 0
          ? (metrics.averageTime * (nonCachedCount - 1) + (cached ? 0 : processingTime)) /
            nonCachedCount
          : 0;

      const cacheHitRate = totalAnalyses > 0 ? cacheHits / totalAnalyses : 0;

      return {
        metrics: {
          averageTime,
          maxTime,
          minTime: minTime === Infinity ? 0 : minTime,
          totalAnalyses,
          cacheHits,
          cacheHitRate,
        },
      };
    });
  },

  reset: () => {
    set({
      analysisCache: new Map(),
      metrics: initialMetrics,
    });
  },
}));
