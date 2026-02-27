/**
 * Main wonder detection service orchestrator
 * Manages analysis workflow, caching, and worker communication
 */

import type { Thought, WonderAnalysis, ThoughtAnalysisRequest, ThoughtAnalysisResponse } from '../types/thought';
import { analyzeText, analyzeTextIncremental, getAlgorithmVersion } from '../lib/wonder-detection/analyzer';
import { isCuriosityMoment, normalizeConfidence } from '../lib/wonder-detection/confidence-scorer';

export interface WonderDetectionConfig {
  /** Use Web Worker for background processing */
  useWorker: boolean;
  /** Cache analysis results */
  enableCache: boolean;
  /** Maximum text length before using incremental analysis */
  incrementalThreshold: number;
  /** Minimum confidence threshold for curiosity moments */
  curiosityThreshold: number;
}

const DEFAULT_CONFIG: WonderDetectionConfig = {
  useWorker: typeof window !== 'undefined' && typeof Worker !== 'undefined',
  enableCache: true,
  incrementalThreshold: 500,
  curiosityThreshold: 0.5,
};

export class WonderDetectionService {
  private config: WonderDetectionConfig;
  private worker: Worker | null = null;
  private cache = new Map<string, WonderAnalysis>();
  private pendingRequests = new Map<string, (analysis: WonderAnalysis) => void>();

  constructor(config: Partial<WonderDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeWorker();
  }

  /**
   * Initialize Web Worker if enabled
   */
  private initializeWorker(): void {
    if (this.config.useWorker && typeof Worker !== 'undefined') {
      try {
        // Note: In production, this would use a proper worker file path
        // For now, we'll use inline worker fallback
        this.worker = null; // Will fall back to synchronous processing
      } catch (error) {
        console.warn('Failed to initialize Web Worker, falling back to sync processing', error);
        this.worker = null;
      }
    }
  }

  /**
   * Analyze a thought for wonder detection
   */
  async analyzeThought(request: ThoughtAnalysisRequest): Promise<ThoughtAnalysisResponse> {
    const { thought, forceReanalysis = false } = request;
    const thoughtId = thought.id;

    // Check cache first
    if (this.config.enableCache && !forceReanalysis) {
      const cached = this.cache.get(thoughtId);
      if (cached) {
        return {
          thought: { ...thought, analysis: cached },
          analysis: cached,
          cached: true,
        };
      }
    }

    // Perform analysis
    const startTime = performance.now();
    const useIncremental = thought.content.length > this.config.incrementalThreshold;
    
    let analysis: WonderAnalysis;

    if (this.worker) {
      analysis = await this.analyzeWithWorker(thought, useIncremental);
    } else {
      analysis = this.analyzeSynchronously(thought, useIncremental, startTime);
    }

    // Cache result
    if (this.config.enableCache) {
      this.cache.set(thoughtId, analysis);
    }

    return {
      thought: { ...thought, analysis },
      analysis,
      cached: false,
    };
  }

  /**
   * Synchronous analysis (fallback when worker not available)
   */
  private analyzeSynchronously(
    thought: Thought,
    useIncremental: boolean,
    startTime: number
  ): WonderAnalysis {
    const result = useIncremental
      ? analyzeTextIncremental(thought.content)
      : analyzeText(thought.content);

    const processingTime = performance.now() - startTime;

    return {
      confidence: normalizeConfidence(result.confidence),
      isCuriosityMoment: isCuriosityMoment(result.confidence, this.config.curiosityThreshold),
      questionPatterns: result.questionPatterns,
      matchedKeywords: result.matchedKeywords,
      emotionalIndicators: result.emotionalIndicators,
      processingTime,
      analyzedAt: new Date(),
      algorithmVersion: getAlgorithmVersion(),
    };
  }

  /**
   * Analysis with Web Worker
   */
  private async analyzeWithWorker(thought: Thought, useIncremental: boolean): Promise<WonderAnalysis> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve) => {
      const thoughtId = thought.id;
      this.pendingRequests.set(thoughtId, resolve);

      this.worker!.postMessage({
        type: 'analyze',
        payload: {
          text: thought.content,
          id: thoughtId,
          useIncremental,
        },
      });
    });
  }

  /**
   * Batch analyze multiple thoughts
   */
  async analyzeThoughts(thoughts: Thought[]): Promise<Map<string, WonderAnalysis>> {
    const results = new Map<string, WonderAnalysis>();

    for (const thought of thoughts) {
      try {
        const response = await this.analyzeThought({ thought });
        results.set(thought.id, response.analysis);
      } catch (error) {
        console.error(`Failed to analyze thought ${thought.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get cached analysis for a thought
   */
  getCachedAnalysis(thoughtId: string): WonderAnalysis | undefined {
    return this.cache.get(thoughtId);
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WonderDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize worker if setting changed
    if ('useWorker' in config) {
      this.cleanup();
      this.initializeWorker();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): WonderDetectionConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
let serviceInstance: WonderDetectionService | null = null;

/**
 * Get the singleton service instance
 */
export function getWonderDetectionService(
  config?: Partial<WonderDetectionConfig>
): WonderDetectionService {
  if (!serviceInstance) {
    serviceInstance = new WonderDetectionService(config);
  }
  return serviceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetWonderDetectionService(): void {
  if (serviceInstance) {
    serviceInstance.cleanup();
    serviceInstance = null;
  }
}
