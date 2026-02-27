/**
 * Connection Detection System
 * Identifies relationships between thoughts based on various criteria
 */

import { Thought, Connection, ConnectionType } from '@/types/constellation';

interface ConnectionConfig {
  keywordThreshold: number;
  temporalWindow: number; // milliseconds
  wonderThreshold: number;
  maxConnections: number;
}

const DEFAULT_CONFIG: ConnectionConfig = {
  keywordThreshold: 0.3,
  temporalWindow: 24 * 60 * 60 * 1000, // 24 hours
  wonderThreshold: 0.5,
  maxConnections: 5
};

export class ConnectionDetector {
  private config: ConnectionConfig;

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect all connections between thoughts
   */
  detectConnections(thoughts: Thought[]): Connection[] {
    const connections: Connection[] = [];
    const thoughtsArray = Array.from(thoughts);

    for (let i = 0; i < thoughtsArray.length; i++) {
      for (let j = i + 1; j < thoughtsArray.length; j++) {
        const source = thoughtsArray[i];
        const target = thoughtsArray[j];

        const connection = this.detectConnection(source, target);
        if (connection) {
          connections.push(connection);
        }
      }
    }

    // Sort by strength and limit connections per node
    return this.pruneConnections(connections, thoughts);
  }

  /**
   * Detect connection between two thoughts
   */
  private detectConnection(source: Thought, target: Thought): Connection | null {
    let maxStrength = 0;
    let connectionType: ConnectionType = ConnectionType.KEYWORD;

    // Keyword similarity
    const keywordStrength = this.calculateKeywordSimilarity(source, target);
    if (keywordStrength > maxStrength) {
      maxStrength = keywordStrength;
      connectionType = ConnectionType.KEYWORD;
    }

    // Temporal proximity
    const temporalStrength = this.calculateTemporalProximity(source, target);
    if (temporalStrength > maxStrength) {
      maxStrength = temporalStrength;
      connectionType = ConnectionType.TEMPORAL;
    }

    // Wonder-based connection
    const wonderStrength = this.calculateWonderConnection(source, target);
    if (wonderStrength > maxStrength) {
      maxStrength = wonderStrength;
      connectionType = ConnectionType.WONDER;
    }

    // Semantic similarity (placeholder for future NLP integration)
    const semanticStrength = this.calculateSemanticSimilarity(source, target);
    if (semanticStrength > maxStrength) {
      maxStrength = semanticStrength;
      connectionType = ConnectionType.SEMANTIC;
    }

    // Only create connection if strength exceeds threshold
    if (maxStrength < this.config.keywordThreshold) {
      return null;
    }

    return {
      id: `${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      strength: maxStrength,
      type: connectionType,
      distance: this.calculateIdealDistance(maxStrength),
      glowIntensity: this.calculateGlowIntensity(maxStrength, source, target)
    };
  }

  /**
   * Calculate keyword similarity using Jaccard index
   */
  private calculateKeywordSimilarity(source: Thought, target: Thought): number {
    const sourceKeywords = new Set((source.keywords || []).map(k => k.toLowerCase()));
    const targetKeywords = new Set((target.keywords || []).map(k => k.toLowerCase()));

    const intersection = new Set(
      [...sourceKeywords].filter(k => targetKeywords.has(k))
    );

    const union = new Set([...sourceKeywords, ...targetKeywords]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Calculate temporal proximity (closer in time = stronger connection)
   */
  private calculateTemporalProximity(source: Thought, target: Thought): number {
    const sourceTime = source.timestamp?.getTime() || source.metadata.timestamp;
    const targetTime = target.timestamp?.getTime() || target.metadata.timestamp;
    
    const timeDiff = Math.abs(sourceTime - targetTime);

    if (timeDiff > this.config.temporalWindow) return 0;

    // Exponential decay
    return Math.exp(-timeDiff / (this.config.temporalWindow / 3));
  }

  /**
   * Calculate wonder-based connection strength
   */
  private calculateWonderConnection(source: Thought, target: Thought): number {
    const sourceWonder = source.wonderScore || 0;
    const targetWonder = target.wonderScore || 0;

    if (sourceWonder < this.config.wonderThreshold && 
        targetWonder < this.config.wonderThreshold) {
      return 0;
    }

    // High wonder thoughts attract each other
    return (sourceWonder + targetWonder) / 2;
  }

  /**
   * Calculate semantic similarity (placeholder)
   */
  private calculateSemanticSimilarity(source: Thought, target: Thought): number {
    // Placeholder: could use embeddings or NLP in the future
    // For now, simple content length and structure similarity
    const sourceLenNorm = Math.min(source.content.length / 1000, 1);
    const targetLenNorm = Math.min(target.content.length / 1000, 1);
    
    return Math.abs(sourceLenNorm - targetLenNorm) < 0.3 ? 0.2 : 0;
  }

  /**
   * Calculate ideal distance between nodes based on connection strength
   */
  private calculateIdealDistance(strength: number): number {
    // Stronger connections = shorter distance
    const minDist = 50;
    const maxDist = 200;
    return maxDist - (strength * (maxDist - minDist));
  }

  /**
   * Calculate glow intensity for connection
   */
  private calculateGlowIntensity(
    strength: number,
    source: Thought,
    target: Thought
  ): number {
    const baseGlow = strength;
    const recency = this.calculateRecency(source, target);
    const wonderBoost = ((source.wonderScore || 0) + (target.wonderScore || 0)) / 2;

    return Math.min(baseGlow * 0.5 + recency * 0.3 + wonderBoost * 0.2, 1);
  }

  /**
   * Calculate recency factor (newer = more glow)
   */
  private calculateRecency(source: Thought, target: Thought): number {
    const now = Date.now();
    const sourceTime = source.timestamp?.getTime() || source.metadata.timestamp;
    const targetTime = target.timestamp?.getTime() || target.metadata.timestamp;
    const mostRecent = Math.max(sourceTime, targetTime);
    const age = now - mostRecent;
    const dayInMs = 24 * 60 * 60 * 1000;

    return Math.exp(-age / dayInMs);
  }

  /**
   * Prune connections to avoid overcrowding
   */
  private pruneConnections(
    connections: Connection[],
    thoughts: Thought[]
  ): Connection[] {
    // Sort by strength
    connections.sort((a, b) => b.strength - a.strength);

    // Track connections per node
    const connectionCount = new Map<string, number>();
    thoughts.forEach(t => connectionCount.set(t.id, 0));

    // Keep strongest connections while respecting max per node
    const pruned: Connection[] = [];
    for (const conn of connections) {
      const sourceCount = connectionCount.get(conn.source) || 0;
      const targetCount = connectionCount.get(conn.target) || 0;

      if (
        sourceCount < this.config.maxConnections &&
        targetCount < this.config.maxConnections
      ) {
        pruned.push(conn);
        connectionCount.set(conn.source, sourceCount + 1);
        connectionCount.set(conn.target, targetCount + 1);
      }
    }

    return pruned;
  }

  /**
   * Update connection config
   */
  updateConfig(config: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const connectionDetector = new ConnectionDetector();
