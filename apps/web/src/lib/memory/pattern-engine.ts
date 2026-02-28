/**
 * Pattern recognition engine for detecting connections across memory history
 * Identifies temporal, semantic, and thematic patterns
 */

import type { Memory, MemoryPattern, PatternDetectionConfig } from '@/types/memory';
import { cosineSimilarity, jaccardSimilarity } from './embeddings';

const DEFAULT_CONFIG: PatternDetectionConfig = {
  minSimilarity: 0.6,
  minPatternConfidence: 0.7,
  temporalWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
  minOccurrences: 3
};

/**
 * Pattern detection engine
 */
export class PatternEngine {
  private config: PatternDetectionConfig;
  private detectedPatterns: Map<string, MemoryPattern>;

  constructor(config: Partial<PatternDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detectedPatterns = new Map();
  }

  /**
   * Detect all patterns in a set of memories
   */
  detectPatterns(memories: Memory[]): MemoryPattern[] {
    const patterns: MemoryPattern[] = [];

    // Detect different pattern types
    patterns.push(...this.detectSemanticPatterns(memories));
    patterns.push(...this.detectTemporalPatterns(memories));
    patterns.push(...this.detectThematicPatterns(memories));
    patterns.push(...this.detectRecurringPatterns(memories));

    // Store detected patterns
    patterns.forEach(pattern => {
      this.detectedPatterns.set(pattern.id, pattern);
    });

    return patterns;
  }

  /**
   * Detect semantic patterns (memories with similar embeddings)
   */
  private detectSemanticPatterns(memories: Memory[]): MemoryPattern[] {
    const patterns: MemoryPattern[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < memories.length; i++) {
      const memory1 = memories[i];
      if (processed.has(memory1.id) || !memory1.embedding) continue;

      const cluster: Memory[] = [memory1];

      for (let j = i + 1; j < memories.length; j++) {
        const memory2 = memories[j];
        if (processed.has(memory2.id) || !memory2.embedding) continue;

        const similarity = cosineSimilarity(memory1.embedding, memory2.embedding);
        if (similarity >= this.config.minSimilarity) {
          cluster.push(memory2);
          processed.add(memory2.id);
        }
      }

      if (cluster.length >= this.config.minOccurrences) {
        processed.add(memory1.id);
        
        const themes = this.extractCommonThemes(cluster);
        const pattern: MemoryPattern = {
          id: this.generatePatternId(),
          description: `Semantic cluster: ${themes.join(', ')}`,
          memoryIds: cluster.map(m => m.id),
          confidence: this.calculatePatternConfidence(cluster, 'semantic'),
          type: 'semantic',
          detectedAt: Date.now(),
          updatedAt: Date.now(),
          occurrences: cluster.length,
          themes
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect temporal patterns (memories that occur in similar time windows)
   */
  private detectTemporalPatterns(memories: Memory[]): MemoryPattern[] {
    const patterns: MemoryPattern[] = [];
    
    // Group memories by time windows
    const timeWindows = new Map<number, Memory[]>();
    
    memories.forEach(memory => {
      const windowKey = Math.floor(memory.createdAt / this.config.temporalWindow);
      if (!timeWindows.has(windowKey)) {
        timeWindows.set(windowKey, []);
      }
      timeWindows.get(windowKey)!.push(memory);
    });

    // Find windows with recurring patterns
    for (const [windowKey, windowMemories] of timeWindows) {
      if (windowMemories.length >= this.config.minOccurrences) {
        const themes = this.extractCommonThemes(windowMemories);
        
        if (themes.length > 0) {
          const pattern: MemoryPattern = {
            id: this.generatePatternId(),
            description: `Temporal pattern in window ${new Date(windowKey * this.config.temporalWindow).toLocaleDateString()}`,
            memoryIds: windowMemories.map(m => m.id),
            confidence: this.calculatePatternConfidence(windowMemories, 'temporal'),
            type: 'temporal',
            detectedAt: Date.now(),
            updatedAt: Date.now(),
            occurrences: windowMemories.length,
            themes
          };

          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Detect thematic patterns (memories sharing common tags/themes)
   */
  private detectThematicPatterns(memories: Memory[]): MemoryPattern[] {
    const patterns: MemoryPattern[] = [];
    
    // Group memories by shared tags
    const tagGroups = new Map<string, Memory[]>();
    
    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(memory);
      });
    });

    // Find significant tag groups
    for (const [tag, tagMemories] of tagGroups) {
      if (tagMemories.length >= this.config.minOccurrences) {
        const pattern: MemoryPattern = {
          id: this.generatePatternId(),
          description: `Thematic pattern around "${tag}"`,
          memoryIds: tagMemories.map(m => m.id),
          confidence: this.calculatePatternConfidence(tagMemories, 'thematic'),
          type: 'thematic',
          detectedAt: Date.now(),
          updatedAt: Date.now(),
          occurrences: tagMemories.length,
          themes: [tag, ...this.extractCommonThemes(tagMemories).filter(t => t !== tag)]
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect recurring patterns (similar content appearing multiple times)
   */
  private detectRecurringPatterns(memories: Memory[]): MemoryPattern[] {
    const patterns: MemoryPattern[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < memories.length; i++) {
      const memory1 = memories[i];
      if (processed.has(memory1.id)) continue;

      const recurring: Memory[] = [memory1];

      for (let j = i + 1; j < memories.length; j++) {
        const memory2 = memories[j];
        if (processed.has(memory2.id)) continue;

        const similarity = jaccardSimilarity(memory1.content, memory2.content);
        if (similarity >= this.config.minSimilarity) {
          recurring.push(memory2);
          processed.add(memory2.id);
        }
      }

      if (recurring.length >= this.config.minOccurrences) {
        processed.add(memory1.id);
        
        const themes = this.extractCommonThemes(recurring);
        const pattern: MemoryPattern = {
          id: this.generatePatternId(),
          description: `Recurring theme: ${themes[0] || 'similar thoughts'}`,
          memoryIds: recurring.map(m => m.id),
          confidence: this.calculatePatternConfidence(recurring, 'recurring'),
          type: 'recurring',
          detectedAt: Date.now(),
          updatedAt: Date.now(),
          occurrences: recurring.length,
          themes
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Find patterns relevant to a given memory
   */
  findRelevantPatterns(memory: Memory, allPatterns: MemoryPattern[]): MemoryPattern[] {
    return allPatterns.filter(pattern => 
      pattern.memoryIds.includes(memory.id) ||
      pattern.themes.some(theme => memory.tags.includes(theme))
    );
  }

  /**
   * Update pattern with new memory
   */
  updatePattern(patternId: string, newMemory: Memory): MemoryPattern | null {
    const pattern = this.detectedPatterns.get(patternId);
    if (!pattern) return null;

    // Add memory to pattern
    if (!pattern.memoryIds.includes(newMemory.id)) {
      pattern.memoryIds.push(newMemory.id);
      pattern.occurrences += 1;
      pattern.updatedAt = Date.now();

      // Recalculate themes
      pattern.themes = this.extractCommonThemes(
        pattern.memoryIds.map(id => ({ tags: newMemory.tags } as Memory))
      );

      this.detectedPatterns.set(patternId, pattern);
    }

    return pattern;
  }

  /**
   * Get all detected patterns
   */
  getAllPatterns(): MemoryPattern[] {
    return Array.from(this.detectedPatterns.values());
  }

  /**
   * Clear all patterns
   */
  clearPatterns(): void {
    this.detectedPatterns.clear();
  }

  // Private helper methods

  private generatePatternId(): string {
    return `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractCommonThemes(memories: Memory[]): string[] {
    const tagFrequency = new Map<string, number>();

    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    // Return tags that appear in at least 50% of memories
    const threshold = Math.ceil(memories.length * 0.5);
    return Array.from(tagFrequency.entries())
      .filter(([_, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  private calculatePatternConfidence(memories: Memory[], type: string): number {
    let confidence = 0.5;

    // More memories = higher confidence
    const countBoost = Math.min(0.2, memories.length * 0.05);
    confidence += countBoost;

    // Higher average memory confidence = higher pattern confidence
    const avgMemoryConfidence = memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length;
    confidence += avgMemoryConfidence * 0.3;

    // Type-specific adjustments
    if (type === 'semantic' || type === 'thematic') {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }
}

// Singleton instance
let instance: PatternEngine | null = null;

export function getPatternEngine(): PatternEngine {
  if (!instance) {
    instance = new PatternEngine();
  }
  return instance;
}
