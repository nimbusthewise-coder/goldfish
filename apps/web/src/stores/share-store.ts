/**
 * Share store
 * Zustand store for managing share state and actions
 */

import { create } from 'zustand';
import type {
  ShareState,
  ShareActions,
  ShareContext,
  ShareComposition,
  ShareLink,
  SharePlatform,
  ShareEvent,
} from '@/types/share';
import { createShare, trackShareEvent, getUserShares } from '@/services/share-service';
import { generateShareId } from '@/lib/share/metadata-encoder';
import { copyLinkToClipboard, generatePlatformUrl } from '@/lib/share/link-generator';

interface ShareStore extends ShareState, ShareActions {}

export const useShareStore = create<ShareStore>((set, get) => ({
  // State
  activeShares: new Map(),
  shareHistory: [],
  analytics: [],
  isGenerating: false,
  lastShareTime: undefined,

  // Actions
  startShare: (context: ShareContext) => {
    const shareId = generateShareId();
    const composition: ShareComposition = {
      context,
      status: 'draft',
      selectedPlatforms: ['link'],
      startTime: Date.now(),
      isComplete: false,
    };

    set((state) => {
      const newActiveShares = new Map(state.activeShares);
      newActiveShares.set(shareId, composition);
      return { activeShares: newActiveShares };
    });

    return shareId;
  },

  updateShare: (shareId: string, updates: Partial<ShareComposition>) => {
    set((state) => {
      const share = state.activeShares.get(shareId);
      if (!share) return state;

      const newActiveShares = new Map(state.activeShares);
      newActiveShares.set(shareId, { ...share, ...updates });
      return { activeShares: newActiveShares };
    });
  },

  generateLink: async (shareId: string) => {
    const share = get().activeShares.get(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    // Update status to generating
    get().updateShare(shareId, { status: 'generating' });
    set({ isGenerating: true });

    try {
      // Create share via service
      const response = await createShare({
        context: share.context,
        platforms: share.selectedPlatforms,
      });

      const link = response.link;

      // Update share with generated link
      get().updateShare(shareId, {
        link,
        status: 'ready',
      });

      // Add to history
      set((state) => ({
        shareHistory: [link.metadata, ...state.shareHistory],
        lastShareTime: Date.now(),
      }));

      return link;
    } catch (error) {
      get().updateShare(shareId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to generate link',
      });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  shareToPlatform: async (shareId: string, platform: SharePlatform) => {
    const share = get().activeShares.get(shareId);
    if (!share || !share.link) {
      throw new Error('Share link not generated');
    }

    const { link } = share;

    try {
      switch (platform) {
        case 'link':
          // Already have the link, just track
          break;

        case 'clipboard':
          const copied = await copyLinkToClipboard(link.url);
          if (!copied) {
            throw new Error('Failed to copy to clipboard');
          }
          break;

        case 'twitter':
        case 'email':
          const platformUrl = generatePlatformUrl(link, platform);
          window.open(platformUrl, '_blank');
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Track share event
      await trackShareEvent(link.metadata.shareId, 'shared', { platform });

      // Track in analytics
      get().trackEvent({
        shareId: link.metadata.shareId,
        type: 'shared',
        platform,
      });

      // Update selected platforms
      get().updateShare(shareId, {
        selectedPlatforms: [...new Set([...share.selectedPlatforms, platform])],
      });
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error);
      throw error;
    }
  },

  copyToClipboard: async (shareId: string) => {
    const share = get().activeShares.get(shareId);
    if (!share || !share.link) {
      return false;
    }

    const success = await copyLinkToClipboard(share.link.url);
    if (success) {
      await get().shareToPlatform(shareId, 'clipboard');
    }
    return success;
  },

  completeShare: (shareId: string) => {
    const share = get().activeShares.get(shareId);
    if (!share) return;

    const completionTime = Date.now() - share.startTime;

    // Track completion time for 30-second goal
    console.log(`Share completed in ${completionTime}ms`);

    get().updateShare(shareId, {
      isComplete: true,
      status: 'shared',
    });

    // Clean up after a delay
    setTimeout(() => {
      set((state) => {
        const newActiveShares = new Map(state.activeShares);
        newActiveShares.delete(shareId);
        return { activeShares: newActiveShares };
      });
    }, 5000);
  },

  cancelShare: (shareId: string) => {
    set((state) => {
      const newActiveShares = new Map(state.activeShares);
      newActiveShares.delete(shareId);
      return { activeShares: newActiveShares };
    });
  },

  getShare: (shareId: string) => {
    return get().activeShares.get(shareId);
  },

  trackEvent: (event: Omit<ShareEvent, 'id' | 'timestamp'>) => {
    const fullEvent: ShareEvent = {
      ...event,
      id: generateShareId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      analytics: [...state.analytics, fullEvent],
    }));
  },

  clearHistory: () => {
    set({
      shareHistory: [],
      analytics: [],
    });
  },
}));

/**
 * Load share history on mount
 */
if (typeof window !== 'undefined') {
  getUserShares().then((history) => {
    useShareStore.setState({ shareHistory: history });
  });
}
