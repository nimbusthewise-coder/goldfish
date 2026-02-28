/**
 * useShare hook
 * React hook for managing share state and actions
 */

import { useCallback, useEffect, useState } from 'react';
import { useShareStore } from '@/stores/share-store';
import type { ShareContext, SharePlatform, ShareLink } from '@/types/share';

export interface UseShareOptions {
  /** Auto-generate link on share start */
  autoGenerate?: boolean;
  /** Callback when share is complete */
  onComplete?: (shareId: string, link: ShareLink) => void;
  /** Callback when share fails */
  onError?: (error: Error) => void;
}

export function useShare(options: UseShareOptions = {}) {
  const {
    startShare,
    generateLink,
    shareToPlatform,
    copyToClipboard,
    completeShare,
    cancelShare,
    getShare,
    isGenerating,
    shareHistory,
  } = useShareStore();

  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [timeToComplete, setTimeToComplete] = useState<number>(0);

  const activeShare = activeShareId ? getShare(activeShareId) : undefined;

  // Start a new share
  const initiateShare = useCallback(
    async (context: ShareContext) => {
      try {
        const shareId = startShare(context);
        setActiveShareId(shareId);

        // Auto-generate link if enabled
        if (options.autoGenerate !== false) {
          const link = await generateLink(shareId);
          return { shareId, link };
        }

        return { shareId, link: undefined };
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [startShare, generateLink, options]
  );

  // Generate shareable link
  const generate = useCallback(async () => {
    if (!activeShareId) {
      throw new Error('No active share');
    }

    try {
      const link = await generateLink(activeShareId);
      return link;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }, [activeShareId, generateLink, options]);

  // Share to a platform
  const share = useCallback(
    async (platform: SharePlatform) => {
      if (!activeShareId) {
        throw new Error('No active share');
      }

      try {
        await shareToPlatform(activeShareId, platform);
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [activeShareId, shareToPlatform, options]
  );

  // Copy link to clipboard
  const copy = useCallback(async () => {
    if (!activeShareId) {
      return false;
    }

    try {
      const success = await copyToClipboard(activeShareId);
      return success;
    } catch (error) {
      options.onError?.(error as Error);
      return false;
    }
  }, [activeShareId, copyToClipboard, options]);

  // Complete the share
  const complete = useCallback(() => {
    if (!activeShareId) {
      return;
    }

    const share = getShare(activeShareId);
    if (share?.link) {
      completeShare(activeShareId);
      options.onComplete?.(activeShareId, share.link);
    }

    setActiveShareId(null);
  }, [activeShareId, completeShare, getShare, options]);

  // Cancel the share
  const cancel = useCallback(() => {
    if (!activeShareId) {
      return;
    }

    cancelShare(activeShareId);
    setActiveShareId(null);
  }, [activeShareId, cancelShare]);

  // Track time to complete (for 30-second goal)
  useEffect(() => {
    if (!activeShare) {
      setTimeToComplete(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeShare.startTime;
      setTimeToComplete(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [activeShare]);

  // Check if within 30-second goal
  const isWithinGoal = timeToComplete < 30000;
  const goalPercentage = Math.min((timeToComplete / 30000) * 100, 100);

  return {
    // State
    activeShare,
    isGenerating,
    shareHistory,
    timeToComplete,
    isWithinGoal,
    goalPercentage,

    // Actions
    initiateShare,
    generate,
    share,
    copy,
    complete,
    cancel,

    // Computed
    hasActiveShare: !!activeShareId,
    isReady: activeShare?.status === 'ready',
    link: activeShare?.link,
    error: activeShare?.error,
  };
}

/**
 * Hook for quick sharing with minimal setup
 */
export function useQuickShare() {
  const { initiateShare, copy, complete } = useShare({
    autoGenerate: true,
  });

  const quickShare = useCallback(
    async (context: ShareContext) => {
      try {
        const { shareId } = await initiateShare(context);
        const copied = await copy();

        if (copied) {
          complete();
          return { success: true, copied: true };
        }

        return { success: true, copied: false };
      } catch (error) {
        console.error('Quick share failed:', error);
        return { success: false, copied: false, error };
      }
    },
    [initiateShare, copy, complete]
  );

  return { quickShare };
}
