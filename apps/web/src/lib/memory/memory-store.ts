/**
 * Core memory storage and retrieval with vector embeddings
 * Implements LRU caching and efficient memory management
 */

import type { Memory, MemorySearchQuery, MemorySearchResult } from '@/types/memory';
import { generateEmbedding, cosineSimilarity, extractKeywords } from './embeddings';

const STORAGE_KEY = 'goldfish_memories';
const CACHE_SIZE = 100;

/**
 * LRU Cache implementation for frequently accessed memories
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Remove oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memory store class for managing long-term memories
 */
export class MemoryStore {
  private memories: Map<string, Memory>;
  private cache: LRUCache<string, Memory>;
  private embeddingCache: Map<string, number[]>;

  constructor() {
    this.memories = new Map();
    this.cache = new LRUCache(CACHE_SIZE);
    this.embeddingCache = new Map();
    this.loadFromStorage();
  }

  /**
   * Add a new memory
   */
  async addMemory(
    content: string,
    thoughtId: string,
    metadata: Memory['metadata']
  ): Promise<Memory> {
    const id = this.generateId();
    const now = Date.now();

    // Generate embedding
    const embedding = await generateEmbedding(content);
    this.embeddingCache.set(id, embedding);

    // Extract keywords
    const keywords = extractKeywords(content);

    const memory: Memory = {
      id,
      content,
      thoughtId,
      embedding,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      confidence: this.calculateInitialConfidence(content, metadata),
      relatedMemories: [],
      tags: keywords,
      metadata
    };

    this.memories.set(id, memory);
    this.cache.set(id, memory);
    this.saveToStorage();

    return memory;
  }

  /**
   * Get a memory by ID
   */
  getMemory(id: string): Memory | undefined {
    // Check cache first
    let memory = this.cache.get(id);
    if (memory) {
      this.updateAccessMetrics(id);
      return memory;
    }

    // Check main storage
    memory = this.memories.get(id);
    if (memory) {
      this.cache.set(id, memory);
      this.updateAccessMetrics(id);
      return memory;
    }

    return undefined;
  }

  /**
   * Search memories semantically
   */
  async searchMemories(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    const {
      query: searchText,
      limit = 10,
      minConfidence = 0,
      tags,
      timeRange
    } = query;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(searchText);

    // Filter and score memories
    const results: MemorySearchResult[] = [];

    for (const [id, memory] of this.memories) {
      // Apply filters
      if (memory.confidence < minConfidence) continue;
      if (tags && tags.length > 0) {
        const hasTag = tags.some(tag => memory.tags.includes(tag));
        if (!hasTag) continue;
      }
      if (timeRange) {
        if (memory.createdAt < timeRange.start || memory.createdAt > timeRange.end) {
          continue;
        }
      }

      // Calculate similarity
      const embedding = memory.embedding || this.embeddingCache.get(id) || [];
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      if (similarity > 0.1) { // Minimum threshold
        results.push({
          memory,
          similarity,
          matchReason: this.getMatchReason(memory, searchText, similarity)
        });
      }
    }

    // Sort by similarity and limit
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get related memories for a given memory
   */
  async getRelatedMemories(memoryId: string, limit: number = 5): Promise<Memory[]> {
    const memory = this.getMemory(memoryId);
    if (!memory) return [];

    // Use stored related memories if available
    if (memory.relatedMemories.length > 0) {
      return memory.relatedMemories
        .map(id => this.getMemory(id))
        .filter((m): m is Memory => m !== undefined)
        .slice(0, limit);
    }

    // Otherwise, find similar memories
    const queryEmbedding = memory.embedding || await generateEmbedding(memory.content);
    const results: Array<{ memory: Memory; similarity: number }> = [];

    for (const [id, otherMemory] of this.memories) {
      if (id === memoryId) continue;

      const embedding = otherMemory.embedding || this.embeddingCache.get(id) || [];
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      if (similarity > 0.3) {
        results.push({ memory: otherMemory, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(r => r.memory);
  }

  /**
   * Update memory with related memories
   */
  updateRelatedMemories(memoryId: string, relatedIds: string[]): void {
    const memory = this.memories.get(memoryId);
    if (memory) {
      memory.relatedMemories = relatedIds;
      this.memories.set(memoryId, memory);
      this.saveToStorage();
    }
  }

  /**
   * Update memory metadata
   */
  updateMemory(id: string, updates: Partial<Memory>): void {
    const memory = this.memories.get(id);
    if (memory) {
      const updated = { ...memory, ...updates };
      this.memories.set(id, updated);
      this.cache.set(id, updated);
      this.saveToStorage();
    }
  }

  /**
   * Delete a memory
   */
  deleteMemory(id: string): void {
    this.memories.delete(id);
    this.embeddingCache.delete(id);
    this.saveToStorage();
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Get memories within time range
   */
  getMemoriesInRange(start: number, end: number): Memory[] {
    return Array.from(this.memories.values()).filter(
      memory => memory.createdAt >= start && memory.createdAt <= end
    );
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.memories.clear();
    this.cache.clear();
    this.embeddingCache.clear();
    this.saveToStorage();
  }

  /**
   * Export memories as JSON
   */
  exportMemories(): string {
    const data = {
      memories: Array.from(this.memories.entries()),
      exportedAt: Date.now(),
      version: '1.0'
    };
    return JSON.stringify(data);
  }

  /**
   * Import memories from JSON
   */
  importMemories(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.memories && Array.isArray(data.memories)) {
        this.memories = new Map(data.memories);
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to import memories:', error);
      throw new Error('Invalid memory data format');
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const memories = Array.from(this.memories.values());
    return {
      totalMemories: memories.length,
      averageConfidence: memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length || 0,
      oldestMemory: memories.length > 0 ? Math.min(...memories.map(m => m.createdAt)) : undefined,
      newestMemory: memories.length > 0 ? Math.max(...memories.map(m => m.createdAt)) : undefined,
      cacheSize: this.cache.size()
    };
  }

  // Private helper methods

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateInitialConfidence(content: string, metadata: Memory['metadata']): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on wonder score
    if (metadata.wonderScore) {
      confidence += metadata.wonderScore * 0.3;
    }

    // Boost confidence based on content length (but cap it)
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 10) {
      confidence += Math.min(0.2, wordCount / 100);
    }

    return Math.min(1.0, confidence);
  }

  private updateAccessMetrics(id: string): void {
    const memory = this.memories.get(id);
    if (memory) {
      memory.lastAccessedAt = Date.now();
      memory.accessCount += 1;
      // Increase confidence slightly with each access (up to a limit)
      memory.confidence = Math.min(1.0, memory.confidence + 0.01);
      this.memories.set(id, memory);
    }
  }

  private getMatchReason(memory: Memory, query: string, similarity: number): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchedTags = memory.tags.filter(tag =>
      queryWords.some(word => tag.includes(word) || word.includes(tag))
    );

    if (matchedTags.length > 0) {
      return `Matched tags: ${matchedTags.join(', ')}`;
    }

    if (similarity > 0.7) {
      return 'Strong semantic match';
    } else if (similarity > 0.5) {
      return 'Moderate semantic match';
    } else {
      return 'Weak semantic match';
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.memories = new Map(data.memories || []);
      }
    } catch (error) {
      console.error('Failed to load memories from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        memories: Array.from(this.memories.entries()),
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save memories to storage:', error);
    }
  }
}

// Singleton instance
let instance: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!instance) {
    instance = new MemoryStore();
  }
  return instance;
}
