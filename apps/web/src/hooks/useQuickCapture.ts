/**
 * Hook for quick capture logic and state management
 * Handles both text and voice input with optimistic updates
 */

import { useState, useCallback, useRef } from 'react';
import { useThoughtsStore } from '@/stores/thoughts-store';
import type { ThoughtCreateInput } from '@/types/thought';
import { performanceMonitor } from '@/utils/performance';

export interface UseQuickCaptureResult {
  captureText: (text: string) => Promise<void>;
  captureVoice: (content: string, audioBlob?: Blob, duration?: number) => Promise<void>;
  isCapturing: boolean;
  lastCaptureTime?: number;
  capturePerformance: number | null;
}

export function useQuickCapture(): UseQuickCaptureResult {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<number>();
  const [capturePerformance, setCapturePerformance] = useState<number | null>(null);
  const addThought = useThoughtsStore((state) => state.addThought);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const captureText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsCapturing(true);
      const startTime = performance.now();

      try {
        const input: ThoughtCreateInput = {
          type: 'text',
          content: text.trim(),
        };

        await addThought(input);

        const duration = performance.now() - startTime;
        setCapturePerformance(duration);
        setLastCaptureTime(Date.now());

        // Log performance
        console.log(`Text capture completed in ${duration.toFixed(2)}ms`);

        // Clear capturing state after a brief moment
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
        }
        captureTimeoutRef.current = setTimeout(() => {
          setIsCapturing(false);
        }, 300);
      } catch (error) {
        console.error('Failed to capture text:', error);
        setIsCapturing(false);
      }
    },
    [addThought]
  );

  const captureVoice = useCallback(
    async (content: string, audioBlob?: Blob, duration?: number) => {
      if (!content.trim() && !audioBlob) return;

      setIsCapturing(true);
      const startTime = performance.now();

      try {
        const input: ThoughtCreateInput = {
          type: 'voice',
          content: content.trim() || '[Recording]',
          rawAudio: audioBlob,
          duration,
        };

        await addThought(input);

        const captureDuration = performance.now() - startTime;
        setCapturePerformance(captureDuration);
        setLastCaptureTime(Date.now());

        // Log performance
        console.log(`Voice capture completed in ${captureDuration.toFixed(2)}ms`);

        // Clear capturing state
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
        }
        captureTimeoutRef.current = setTimeout(() => {
          setIsCapturing(false);
        }, 300);
      } catch (error) {
        console.error('Failed to capture voice:', error);
        setIsCapturing(false);
      }
    },
    [addThought]
  );

  return {
    captureText,
    captureVoice,
    isCapturing,
    lastCaptureTime,
    capturePerformance,
  };
}
