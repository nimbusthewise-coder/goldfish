/**
 * Web Worker for background wonder detection processing
 * Prevents UI blocking during analysis
 */

import { analyzeText, analyzeTextIncremental, getAlgorithmVersion } from '../lib/wonder-detection/analyzer';

export interface WorkerRequest {
  type: 'analyze' | 'batch-analyze';
  payload: {
    text: string;
    id: string;
    useIncremental?: boolean;
  } | {
    texts: Array<{ text: string; id: string }>;
    useIncremental?: boolean;
  };
}

export interface WorkerResponse {
  type: 'analysis-complete' | 'batch-complete' | 'error';
  payload: {
    id: string;
    confidence: number;
    questionPatterns: string[];
    matchedKeywords: string[];
    emotionalIndicators: string[];
    processingTime: number;
    algorithmVersion: string;
  } | {
    results: Array<{
      id: string;
      confidence: number;
      questionPatterns: string[];
      matchedKeywords: string[];
      emotionalIndicators: string[];
      processingTime: number;
    }>;
    totalTime: number;
    algorithmVersion: string;
  } | {
    error: string;
    id?: string;
  };
}

// Worker context
const ctx: Worker = self as any;

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  try {
    if (type === 'analyze') {
      const { text, id, useIncremental } = payload as {
        text: string;
        id: string;
        useIncremental?: boolean;
      };

      const startTime = performance.now();
      const result = useIncremental
        ? analyzeTextIncremental(text)
        : analyzeText(text);
      const processingTime = performance.now() - startTime;

      const response: WorkerResponse = {
        type: 'analysis-complete',
        payload: {
          id,
          confidence: result.confidence,
          questionPatterns: result.questionPatterns,
          matchedKeywords: result.matchedKeywords,
          emotionalIndicators: result.emotionalIndicators,
          processingTime,
          algorithmVersion: getAlgorithmVersion(),
        },
      };

      ctx.postMessage(response);
    } else if (type === 'batch-analyze') {
      const { texts, useIncremental } = payload as {
        texts: Array<{ text: string; id: string }>;
        useIncremental?: boolean;
      };

      const batchStartTime = performance.now();
      const results = texts.map(({ text, id }) => {
        const startTime = performance.now();
        const result = useIncremental
          ? analyzeTextIncremental(text)
          : analyzeText(text);
        const processingTime = performance.now() - startTime;

        return {
          id,
          confidence: result.confidence,
          questionPatterns: result.questionPatterns,
          matchedKeywords: result.matchedKeywords,
          emotionalIndicators: result.emotionalIndicators,
          processingTime,
        };
      });
      const totalTime = performance.now() - batchStartTime;

      const response: WorkerResponse = {
        type: 'batch-complete',
        payload: {
          results,
          totalTime,
          algorithmVersion: getAlgorithmVersion(),
        },
      };

      ctx.postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        id: 'id' in payload ? (payload as any).id : undefined,
      },
    };

    ctx.postMessage(response);
  }
});

// Signal worker is ready
ctx.postMessage({ type: 'ready' });
