/**
 * Zustand store for memory state management
 * Provides React state management for the memory system
 */

import { create } from 'zustand';
import type {
  Memory,
  MemoryPattern,
  MemoryInsight,
  MemoryContext,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryStats,
  MemoryStoreState
} from '@/types/memory';
import { getMemoryService } from '@/services/memory-service';

const memoryService = getMemoryService();

export const useMemoryStore = create<MemoryStoreState>((set, get) => ({
  // State
  memories: new Map<string, Memory>(),
  patterns: new Map<string, MemoryPattern>(),
  insights: [],
  cache: new Map<string, Memory>(),
  maxCacheSize: 100,
  isProcessing: false,
  lastProcessedAt: undefined,

  // Actions
  addMemory: async (memoryData) => {
    const memory = await memoryService.processThought({
      id: memoryData.thoughtId,
      content: memoryData.content,
      type: 'text',
      metadata: {
        timestamp: memoryData.metadata.timestamp,
        deviceId: 'web',
        tags: memoryData.metadata.userTags,
        confidence: memoryData.confidence
      },
      syncStatus: 'synced',
      createdAt: memoryData.metadata.timestamp,
      updatedAt: memoryData.metadata.timestamp,
      retryCount: 0,
      wonderScore: memoryData.metadata.wonderScore,
      keywords: memoryData.tags
    } as any);

    set((state) => {
      const newMemories = new Map(state.memories);
      newMemories.set(memory.id, memory);
      return { memories: newMemories };
    });

    return memory;
  },

  getMemory: (id) => {
    return get().memories.get(id);
  },

  searchMemories: async (query: MemorySearchQuery) => {
    const results = await memoryService.searchMemories(query);
    return results;
  },

  getRelatedMemories: async (memoryId: string, limit = 5) => {
    const memory = get().memories.get(memoryId);
    if (!memory) return [];

    const allMemories = Array.from(get().memories.values());
    const relatedIds = memory.relatedMemories.slice(0, limit);
    
    return relatedIds
      .map(id => get().memories.get(id))
      .filter((m): m is Memory => m !== undefined);
  },

  updateMemory: (id, updates) => {
    set((state) => {
      const memory = state.memories.get(id);
      if (!memory) return state;

      const updated = { ...memory, ...updates };
      const newMemories = new Map(state.memories);
      newMemories.set(id, updated);
      return { memories: newMemories };
    });
  },

  deleteMemory: (id) => {
    set((state) => {
      const newMemories = new Map(state.memories);
      newMemories.delete(id);
      return { memories: newMemories };
    });
  },

  getPatterns: () => {
    return Array.from(get().patterns.values());
  },

  getInsights: async (context: MemoryContext) => {
    set({ isProcessing: true });
    
    try {
      const insights = await memoryService.getInsights(context);
      set({ insights, isProcessing: false });
      return insights;
    } catch (error) {
      console.error('Failed to get insights:', error);
      set({ isProcessing: false });
      return [];
    }
  },

  dismissInsight: (insightId) => {
    memoryService.dismissInsight(insightId);
    set((state) => ({
      insights: state.insights.map(insight =>
        insight.id === insightId ? { ...insight, dismissed: true } : insight
      )
    }));
  },

  markInsightShown: (insightId) => {
    memoryService.markInsightShown(insightId);
    set((state) => ({
      insights: state.insights.map(insight =>
        insight.id === insightId ? { ...insight, shown: true } : insight
      )
    }));
  },

  getStats: () => {
    return memoryService.getStats();
  },

  clearAll: () => {
    memoryService.clearAll();
    set({
      memories: new Map(),
      patterns: new Map(),
      insights: [],
      cache: new Map()
    });
  },

  exportMemories: async () => {
    return await memoryService.exportMemories();
  },

  importMemories: async (data: string) => {
    await memoryService.importMemories(data);
    
    // Refresh state
    const patterns = memoryService.getPatterns();
    const patternsMap = new Map(patterns.map(p => [p.id, p]));
    
    set({ patterns: patternsMap });
  }
}));

/**
 * Hook to sync thoughts with memory system
 */
export function useSyncMemories() {
  const addMemory = useMemoryStore(state => state.addMemory);

  const syncThought = async (thought: any) => {
    try {
      await addMemory({
        content: thought.content,
        thoughtId: thought.id,
        embedding: undefined,
        confidence: thought.wonderScore || 0.5,
        relatedMemories: [],
        tags: thought.keywords || [],
        metadata: {
          timestamp: thought.createdAt,
          wonderScore: thought.wonderScore,
          userTags: thought.metadata?.tags,
          themes: thought.keywords
        }
      });
    } catch (error) {
      console.error('Failed to sync thought to memory:', error);
    }
  };

  return { syncThought };
}
