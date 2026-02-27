/**
 * React hook for wonder detection integration
 * Provides easy access to detection service with React state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Thought, WonderAnalysis } from '../types/thought';
import { getWonderDetectionService } from '../services/wonder-detection-service';
import { useThoughtStore } from '../stores/thought-store';

export interface UseWonderDetectionOptions {
  /** Auto-analyze on thought creation/update */
  autoAnalyze?: boolean;
  /** Debounce delay in milliseconds for auto-analysis */
  debounceMs?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
}

export interface UseWonderDetectionResult {
  /** Analyze a single thought */
  analyzeThought: (thought: Thought) => Promise<WonderAnalysis>;
  
  /** Analyze multiple thoughts */
  analyzeThoughts: (thoughts: Thought[]) => Promise<Map<string, WonderAnalysis>>;
  
  /** Get cached analysis for a thought */
  getCachedAnalysis: (thoughtId: string) => WonderAnalysis | undefined;
  
  /** Clear analysis cache */
  clearCache: () => void;
  
  /** Current analysis state */
  isAnalyzing: boolean;
  
  /** Last analysis error */
  error: Error | null;
  
  /** Performance metrics */
  metrics: {
    averageTime: number;
    maxTime: number;
    minTime: number;
    totalAnalyses: number;
    cacheHits: number;
    cacheHitRate: number;
  };
}

export function useWonderDetection(
  options: UseWonderDetectionOptions = {}
): UseWonderDetectionResult {
  const {
    autoAnalyze = false,
    debounceMs = 300,
    minConfidence = 0.5,
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const service = useRef(getWonderDetectionService({
    curiosityThreshold: minConfidence,
  }));

  const cacheAnalysis = useThoughtStore((state) => state.cacheAnalysis);
  const getStoreCache = useThoughtStore((state) => state.getCachedAnalysis);
  const updateMetrics = useThoughtStore((state) => state.updateMetrics);
  const metrics = useThoughtStore((state) => state.metrics);
  const clearStoreCache = useThoughtStore((state) => state.clearCache);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Analyze a single thought
   */
  const analyzeThought = useCallback(
    async (thought: Thought): Promise<WonderAnalysis> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await service.current.analyzeThought({ thought });
        
        // Update store cache and metrics
        cacheAnalysis(thought.id, response.analysis);
        updateMetrics(response.analysis.processingTime, response.cached);

        return response.analysis;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Analysis failed');
        setError(error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [cacheAnalysis, updateMetrics]
  );

  /**
   * Analyze multiple thoughts
   */
  const analyzeThoughts = useCallback(
    async (thoughts: Thought[]): Promise<Map<string, WonderAnalysis>> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const results = await service.current.analyzeThoughts(thoughts);
        
        // Update store cache and metrics for each result
        results.forEach((analysis, thoughtId) => {
          cacheAnalysis(thoughtId, analysis);
          updateMetrics(analysis.processingTime, false);
        });

        return results;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Batch analysis failed');
        setError(error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [cacheAnalysis, updateMetrics]
  );

  /**
   * Get cached analysis (from store)
   */
  const getCachedAnalysis = useCallback(
    (thoughtId: string): WonderAnalysis | undefined => {
      return getStoreCache(thoughtId);
    },
    [getStoreCache]
  );

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    service.current.clearCache();
    clearStoreCache();
  }, [clearStoreCache]);

  /**
   * Debounced auto-analysis effect
   */
  useEffect(() => {
    if (!autoAnalyze) return;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [autoAnalyze, debounceMs]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    analyzeThought,
    analyzeThoughts,
    getCachedAnalysis,
    clearCache,
    isAnalyzing,
    error,
    metrics,
  };
}

/**
 * Hook for real-time analysis of text input
 */
export function useRealtimeWonderDetection(
  text: string,
  options: UseWonderDetectionOptions = {}
): {
  analysis: WonderAnalysis | null;
  isAnalyzing: boolean;
  error: Error | null;
} {
  const [analysis, setAnalysis] = useState<WonderAnalysis | null>(null);
  const { analyzeThought, isAnalyzing, error } = useWonderDetection(options);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't analyze empty text
    if (!text.trim()) {
      setAnalysis(null);
      return;
    }

    // Debounce analysis
    debounceTimerRef.current = setTimeout(() => {
      const thought: Thought = {
        id: `temp-${Date.now()}`,
        type: 'text',
        content: text,
        metadata: {
          timestamp: Date.now(),
          deviceId: 'browser',
        },
        syncStatus: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0,
      };

      analyzeThought(thought)
        .then(setAnalysis)
        .catch(() => {
          // Error handled by the hook
        });
    }, options.debounceMs || 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, analyzeThought, options.debounceMs]);

  return {
    analysis,
    isAnalyzing,
    error,
  };
}
