/**
 * Memory service - High-level API for memory system operations
 * Coordinates between memory store, pattern engine, and insight generation
 */

import type { Thought } from '@/types/thought';
import type {
  Memory,
  MemoryInsight,
  MemoryContext,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryPattern,
  MemoryStats
} from '@/types/memory';
import { getMemoryStore } from '@/lib/memory/memory-store';
import { getPatternEngine } from '@/lib/memory/pattern-engine';

/**
 * Memory service class
 */
class MemoryService {
  private memoryStore = getMemoryStore();
  private patternEngine = getPatternEngine();
  private insights: MemoryInsight[] = [];
  private isProcessing = false;
  private lastProcessedAt?: number;

  /**
   * Process a thought and create a memory
   */
  async processThought(thought: Thought): Promise<Memory> {
    const memory = await this.memoryStore.addMemory(
      thought.content,
      thought.id,
      {
        timestamp: thought.createdAt,
        wonderScore: thought.wonderScore,
        userTags: thought.metadata.tags,
        themes: thought.keywords
      }
    );

    // Trigger background pattern detection (debounced)
    this.schedulePatternDetection();

    return memory;
  }

  /**
   * Process multiple thoughts in batch
   */
  async processThoughts(thoughts: Thought[]): Promise<Memory[]> {
    const memories: Memory[] = [];

    for (const thought of thoughts) {
      const memory = await this.processThought(thought);
      memories.push(memory);
    }

    return memories;
  }

  /**
   * Search memories
   */
  async searchMemories(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    return this.memoryStore.searchMemories(query);
  }

  /**
   * Get related memories for a thought
   */
  async getRelatedMemories(thoughtId: string): Promise<Memory[]> {
    // Find memory for this thought
    const memories = this.memoryStore.getAllMemories();
    const memory = memories.find(m => m.thoughtId === thoughtId);

    if (!memory) return [];

    return this.memoryStore.getRelatedMemories(memory.id);
  }

  /**
   * Get insights for current context
   */
  async getInsights(context: MemoryContext): Promise<MemoryInsight[]> {
    const newInsights: MemoryInsight[] = [];

    // Generate connection insights
    if (context.currentThought) {
      const connectionInsights = await this.generateConnectionInsights(
        context.currentThought,
        context
      );
      newInsights.push(...connectionInsights);
    }

    // Generate pattern insights
    const patternInsights = await this.generatePatternInsights(context);
    newInsights.push(...patternInsights);

    // Generate reminder insights
    const reminderInsights = await this.generateReminderInsights(context);
    newInsights.push(...reminderInsights);

    // Store new insights
    this.insights.push(...newInsights);

    // Return only non-dismissed insights
    return this.insights.filter(insight => !insight.dismissed);
  }

  /**
   * Get all detected patterns
   */
  getPatterns(): MemoryPattern[] {
    return this.patternEngine.getAllPatterns();
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const storeStats = this.memoryStore.getStats();
    const patterns = this.patternEngine.getAllPatterns();
    const insights = this.insights.filter(i => !i.dismissed);

    return {
      totalMemories: storeStats.totalMemories,
      totalPatterns: patterns.length,
      totalInsights: insights.length,
      averageConfidence: storeStats.averageConfidence,
      oldestMemory: storeStats.oldestMemory,
      newestMemory: storeStats.newestMemory,
      storageSize: this.estimateStorageSize(),
      cacheHitRate: 0.85 // Placeholder - would track this in production
    };
  }

  /**
   * Dismiss an insight
   */
  dismissInsight(insightId: string): void {
    const insight = this.insights.find(i => i.id === insightId);
    if (insight) {
      insight.dismissed = true;
    }
  }

  /**
   * Mark insight as shown
   */
  markInsightShown(insightId: string): void {
    const insight = this.insights.find(i => i.id === insightId);
    if (insight) {
      insight.shown = true;
    }
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.memoryStore.clearAll();
    this.patternEngine.clearPatterns();
    this.insights = [];
  }

  /**
   * Export memories
   */
  async exportMemories(): Promise<string> {
    return this.memoryStore.exportMemories();
  }

  /**
   * Import memories
   */
  async importMemories(data: string): Promise<void> {
    this.memoryStore.importMemories(data);
    await this.detectPatterns();
  }

  // Private methods

  /**
   * Schedule pattern detection (debounced)
   */
  private schedulePatternDetection(): void {
    if (this.isProcessing) return;

    // Debounce pattern detection to avoid excessive processing
    setTimeout(() => {
      this.detectPatterns();
    }, 5000);
  }

  /**
   * Detect patterns in all memories
   */
  private async detectPatterns(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const memories = this.memoryStore.getAllMemories();
      const patterns = this.patternEngine.detectPatterns(memories);

      // Update related memories based on patterns
      patterns.forEach(pattern => {
        pattern.memoryIds.forEach(memoryId => {
          const relatedIds = pattern.memoryIds.filter(id => id !== memoryId);
          this.memoryStore.updateRelatedMemories(memoryId, relatedIds);
        });
      });

      this.lastProcessedAt = Date.now();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate connection insights
   */
  private async generateConnectionInsights(
    currentThought: string,
    context: MemoryContext
  ): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];

    const searchResults = await this.memoryStore.searchMemories({
      query: currentThought,
      limit: 3,
      minConfidence: 0.5
    });

    searchResults.forEach(result => {
      if (result.similarity > 0.7) {
        insights.push({
          id: this.generateInsightId(),
          type: 'connection',
          message: `This reminds me of "${result.memory.content.substring(0, 50)}..." from ${this.formatTimestamp(result.memory.createdAt)}`,
          confidence: result.similarity,
          relatedMemories: [result.memory.id],
          generatedAt: Date.now(),
          shown: false,
          dismissed: false,
          triggerContext: currentThought
        });
      }
    });

    return insights;
  }

  /**
   * Generate pattern insights
   */
  private async generatePatternInsights(context: MemoryContext): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    const patterns = this.patternEngine.getAllPatterns();

    // Find patterns relevant to recent context
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7 && pattern.occurrences >= 3) {
        const recentMemories = pattern.memoryIds
          .map(id => this.memoryStore.getMemory(id))
          .filter((m): m is Memory => m !== undefined)
          .filter(m => Date.now() - m.createdAt < context.timeWindow);

        if (recentMemories.length >= 2) {
          insights.push({
            id: this.generateInsightId(),
            type: 'pattern',
            message: `I've noticed you often think about ${pattern.themes.join(', ')} - ${pattern.occurrences} times recently`,
            confidence: pattern.confidence,
            relatedMemories: pattern.memoryIds.slice(0, 5),
            relatedPatterns: [pattern.id],
            generatedAt: Date.now(),
            shown: false,
            dismissed: false
          });
        }
      }
    });

    return insights;
  }

  /**
   * Generate reminder insights
   */
  private async generateReminderInsights(context: MemoryContext): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Find high-confidence memories that haven't been accessed recently
    const memories = this.memoryStore.getAllMemories();
    const forgottenMemories = memories.filter(
      m => m.confidence > 0.8 && m.lastAccessedAt < weekAgo && m.createdAt > weekAgo
    );

    forgottenMemories.slice(0, 2).forEach(memory => {
      insights.push({
        id: this.generateInsightId(),
        type: 'reminder',
        message: `Don't forget about "${memory.content.substring(0, 50)}..." from ${this.formatTimestamp(memory.createdAt)}`,
        confidence: memory.confidence,
        relatedMemories: [memory.id],
        generatedAt: now,
        shown: false,
        dismissed: false
      });
    });

    return insights;
  }

  private generateInsightId(): string {
    return `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  private estimateStorageSize(): number {
    const data = this.memoryStore.exportMemories();
    return new Blob([data]).size;
  }
}

// Singleton instance
let instance: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!instance) {
    instance = new MemoryService();
  }
  return instance;
}

export default MemoryService;
