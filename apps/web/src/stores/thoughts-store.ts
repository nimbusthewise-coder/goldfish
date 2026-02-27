/**
 * Local-first thought storage using Zustand
 * Provides optimistic UI updates and local persistence
 */

import { create } from 'zustand';
import type { Thought, ThoughtCreateInput, ThoughtsState } from '@/types/thought';
import { localStorage } from '@/lib/storage/local-storage';
import { backgroundSync } from '@/lib/sync/background-sync';
import { generateId, getDeviceId, performanceMonitor } from '@/utils/performance';

export const useThoughtsStore = create<ThoughtsState>((set, get) => {
  // Initialize storage (client-side only)
  if (typeof window !== 'undefined') {
    localStorage.init().catch(console.error);

    // Load initial data from storage
    localStorage.getAllThoughts().then((thoughts) => {
      set({ thoughts });
    });

    // Start background sync
    backgroundSync.start(async () => {
      return get().getPendingSync();
    });
  }

  return {
    thoughts: [],
    isCapturing: false,

    addThought: async (input: ThoughtCreateInput): Promise<Thought> => {
      return performanceMonitor.measure('add-thought', async () => {
        const now = Date.now();
        
        const thought: Thought = {
          id: generateId(),
          type: input.type,
          content: input.content,
          rawAudio: input.rawAudio,
          metadata: {
            timestamp: now,
            deviceId: getDeviceId(),
            duration: input.duration,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
          syncStatus: 'pending',
          createdAt: now,
          updatedAt: now,
          retryCount: 0,
        };

        // Optimistic update - add to state immediately
        set((state) => ({
          thoughts: [thought, ...state.thoughts],
          lastCaptureTime: now,
        }));

        // Persist to IndexedDB (async, non-blocking)
        localStorage.saveThought(thought).catch((error) => {
          console.error('Failed to save thought to storage:', error);
          // Revert optimistic update if save fails
          set((state) => ({
            thoughts: state.thoughts.filter((t) => t.id !== thought.id),
          }));
        });

        return thought;
      });
    },

    updateThought: (id: string, updates: Partial<Thought>) => {
      set((state: ThoughtsState) => ({
        thoughts: state.thoughts.map((t: Thought) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: Date.now() }
            : t
        ),
      }));

      // Persist update
      const thought = get().getThought(id);
      if (thought) {
        localStorage.saveThought(thought).catch(console.error);
      }
    },

    deleteThought: (id: string) => {
      set((state: ThoughtsState) => ({
        thoughts: state.thoughts.filter((t: Thought) => t.id !== id),
      }));

      localStorage.deleteThought(id).catch(console.error);
    },

    getThought: (id: string) => {
      return get().thoughts.find((t: Thought) => t.id === id);
    },

    getRecentThoughts: (limit = 10) => {
      return get().thoughts.slice(0, limit);
    },

    getPendingSync: () => {
      return get().thoughts.filter((t: Thought) => t.syncStatus === 'pending');
    },

    markSynced: (id: string) => {
      get().updateThought(id, {
        syncStatus: 'synced',
        syncedAt: Date.now(),
      });
    },

    markSyncFailed: (id: string, error: string) => {
      const thought = get().getThought(id);
      get().updateThought(id, {
        syncStatus: 'failed',
        error,
        retryCount: (thought?.retryCount || 0) + 1,
      });
    },

    clearAll: () => {
      set({ thoughts: [] });
      localStorage.clearAll().catch(console.error);
    },
  };
});
