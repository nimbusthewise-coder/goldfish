/**
 * Connection Discovery Service
 * Discovers and manages connections between thoughts and memories
 */

import type { Thought } from '@/types/thought';
import type { Memory } from '@/types/memory';
import type {
  Connection,
  ConnectionType,
  ConnectionGraph,
  NodeMetadata,
  ConnectionCluster,
  ConnectionPath,
  ConnectionSearchQuery,
  ConnectionAnalysis,
  ConnectionDiscoveryConfig
} from '@/types/connections';
import {
  combinedSimilarity,
  extractKeywords,
  jaccardSimilarity,
  tokenize
} from '@/lib/similarity';

/**
 * Connection Service
 */
class ConnectionService {
  private connections = new Map<string, Connection>();
  private graph: ConnectionGraph = {
    nodes: new Set(),
    edges: new Map(),
    nodeMetadata: new Map()
  };
  private clusters: ConnectionCluster[] = [];
  private config: ConnectionDiscoveryConfig = {
    minSemanticSimilarity: 0.3,
    maxTemporalDelta: 7 * 24 * 60 * 60 * 1000, // 7 days
    minSharedTags: 2,
    batchSize: 50,
    enableBackgroundDiscovery: true,
    discoveryInterval: 60000 // 1 minute
  };
  private isDiscovering = false;
  private discoveryInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start background discovery if enabled
    if (this.config.enableBackgroundDiscovery) {
      this.startBackgroundDiscovery();
    }
  }

  /**
   * Discover connections for new items
   */
  async discoverConnections(
    items: Array<{ id: string; content: string; timestamp: number; tags?: string[]; type: 'thought' | 'memory' }>,
    existingItems: Array<{ id: string; content: string; timestamp: number; tags?: string[]; type: 'thought' | 'memory' }>
  ): Promise<Connection[]> {
    if (this.isDiscovering) {
      console.log('Discovery already in progress, skipping...');
      return [];
    }

    this.isDiscovering = true;
    const newConnections: Connection[] = [];

    try {
      // Add nodes to graph
      items.forEach(item => this.addNode(item));
      existingItems.forEach(item => this.addNode(item));

      // Build corpus for semantic analysis
      const corpus = [...items, ...existingItems].map(item => item.content);

      // Discover connections for each new item
      for (const item of items) {
        // Semantic connections
        const semanticConnections = this.discoverSemanticConnections(
          item,
          existingItems,
          corpus
        );
        newConnections.push(...semanticConnections);

        // Temporal connections
        const temporalConnections = this.discoverTemporalConnections(
          item,
          existingItems
        );
        newConnections.push(...temporalConnections);

        // Contextual connections
        const contextualConnections = this.discoverContextualConnections(
          item,
          existingItems
        );
        newConnections.push(...contextualConnections);

        // Categorical connections
        const categoricalConnections = this.discoverCategoricalConnections(
          item,
          existingItems
        );
        newConnections.push(...categoricalConnections);
      }

      // Add connections to graph
      newConnections.forEach(conn => this.addConnectionToGraph(conn));

      // Detect clusters
      this.detectClusters();

      return newConnections;
    } finally {
      this.isDiscovering = false;
    }
  }

  /**
   * Discover semantic connections based on content similarity
   */
  private discoverSemanticConnections(
    item: { id: string; content: string; timestamp: number; tags?: string[] },
    candidates: Array<{ id: string; content: string; timestamp: number; tags?: string[] }>,
    corpus: string[]
  ): Connection[] {
    const connections: Connection[] = [];

    for (const candidate of candidates) {
      if (candidate.id === item.id) continue;

      const similarity = combinedSimilarity(item.content, candidate.content, corpus);

      if (similarity >= this.config.minSemanticSimilarity) {
        const sharedThemes = this.findSharedThemes(item.content, candidate.content);

        connections.push({
          id: this.generateConnectionId(),
          sourceId: item.id,
          targetId: candidate.id,
          type: 'semantic',
          weight: similarity,
          confidence: similarity,
          reason: `Similar content: ${sharedThemes.slice(0, 3).join(', ')}`,
          sharedThemes,
          discoveredAt: Date.now(),
          confirmed: false,
          dismissed: false,
          viewCount: 0,
          metadata: {
            similarityScore: similarity
          }
        });
      }
    }

    return connections;
  }

  /**
   * Discover temporal connections based on time proximity
   */
  private discoverTemporalConnections(
    item: { id: string; content: string; timestamp: number; tags?: string[] },
    candidates: Array<{ id: string; content: string; timestamp: number; tags?: string[] }>
  ): Connection[] {
    const connections: Connection[] = [];

    for (const candidate of candidates) {
      if (candidate.id === item.id) continue;

      const timeDelta = Math.abs(item.timestamp - candidate.timestamp);

      if (timeDelta <= this.config.maxTemporalDelta) {
        // Weight decreases with time distance
        const weight = 1 - (timeDelta / this.config.maxTemporalDelta);
        const confidence = weight * 0.8; // Temporal connections are less certain

        connections.push({
          id: this.generateConnectionId(),
          sourceId: item.id,
          targetId: candidate.id,
          type: 'temporal',
          weight,
          confidence,
          reason: `Created around the same time (${this.formatTimeDelta(timeDelta)})`,
          sharedThemes: [],
          discoveredAt: Date.now(),
          confirmed: false,
          dismissed: false,
          viewCount: 0,
          metadata: {
            timeDelta
          }
        });
      }
    }

    return connections;
  }

  /**
   * Discover contextual connections based on shared tags
   */
  private discoverContextualConnections(
    item: { id: string; content: string; timestamp: number; tags?: string[] },
    candidates: Array<{ id: string; content: string; timestamp: number; tags?: string[] }>
  ): Connection[] {
    const connections: Connection[] = [];

    if (!item.tags || item.tags.length === 0) return connections;

    for (const candidate of candidates) {
      if (candidate.id === item.id || !candidate.tags || candidate.tags.length === 0) continue;

      const sharedTags = item.tags.filter(tag => candidate.tags!.includes(tag));

      if (sharedTags.length >= this.config.minSharedTags) {
        const weight = sharedTags.length / Math.max(item.tags.length, candidate.tags.length);

        connections.push({
          id: this.generateConnectionId(),
          sourceId: item.id,
          targetId: candidate.id,
          type: 'contextual',
          weight,
          confidence: weight * 0.9,
          reason: `Shared context: ${sharedTags.join(', ')}`,
          sharedThemes: sharedTags,
          discoveredAt: Date.now(),
          confirmed: false,
          dismissed: false,
          viewCount: 0,
          metadata: {
            sharedTags
          }
        });
      }
    }

    return connections;
  }

  /**
   * Discover categorical connections based on content themes
   */
  private discoverCategoricalConnections(
    item: { id: string; content: string; timestamp: number; tags?: string[] },
    candidates: Array<{ id: string; content: string; timestamp: number; tags?: string[] }>
  ): Connection[] {
    const connections: Connection[] = [];
    const itemKeywords = new Set(extractKeywords(item.content, 10));

    for (const candidate of candidates) {
      if (candidate.id === item.id) continue;

      const candidateKeywords = new Set(extractKeywords(candidate.content, 10));
      const similarity = jaccardSimilarity(itemKeywords, candidateKeywords);

      if (similarity >= 0.4) {
        const sharedKeywords = Array.from(itemKeywords).filter(k => candidateKeywords.has(k));

        connections.push({
          id: this.generateConnectionId(),
          sourceId: item.id,
          targetId: candidate.id,
          type: 'categorical',
          weight: similarity,
          confidence: similarity * 0.85,
          reason: `Similar themes: ${sharedKeywords.slice(0, 3).join(', ')}`,
          sharedThemes: sharedKeywords,
          discoveredAt: Date.now(),
          confirmed: false,
          dismissed: false,
          viewCount: 0
        });
      }
    }

    return connections;
  }

  /**
   * Find shared themes between two texts
   */
  private findSharedThemes(textA: string, textB: string): string[] {
    const tokensA = new Set(tokenize(textA));
    const tokensB = new Set(tokenize(textB));
    return Array.from(tokensA).filter(token => tokensB.has(token));
  }

  /**
   * Add a node to the graph
   */
  private addNode(item: { id: string; content: string; timestamp: number; tags?: string[]; type: 'thought' | 'memory' }): void {
    if (!this.graph.nodes.has(item.id)) {
      this.graph.nodes.add(item.id);
      this.graph.nodeMetadata.set(item.id, {
        id: item.id,
        contentPreview: item.content.substring(0, 100),
        content: item.content,
        type: item.type,
        timestamp: item.timestamp,
        tags: item.tags || [],
        connectionCount: 0,
        clusteringCoefficient: 0
      });
    }
  }

  /**
   * Add connection to graph
   */
  private addConnectionToGraph(connection: Connection): void {
    this.connections.set(connection.id, connection);

    // Add to edges
    if (!this.graph.edges.has(connection.sourceId)) {
      this.graph.edges.set(connection.sourceId, []);
    }
    this.graph.edges.get(connection.sourceId)!.push(connection);

    // Update connection counts
    const sourceMetadata = this.graph.nodeMetadata.get(connection.sourceId);
    if (sourceMetadata) {
      sourceMetadata.connectionCount++;
    }
  }

  /**
   * Find path between two nodes using BFS
   */
  findPath(sourceId: string, targetId: string, maxDepth: number = 3): ConnectionPath | null {
    const queue: Array<{ node: string; path: string[]; connections: Connection[]; weight: number }> = [
      { node: sourceId, path: [sourceId], connections: [], weight: 1 }
    ];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === targetId) {
        return {
          path: current.path,
          connections: current.connections,
          weight: current.weight,
          length: current.path.length - 1
        };
      }

      if (current.path.length > maxDepth) continue;

      const edges = this.graph.edges.get(current.node) || [];
      for (const edge of edges) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({
            node: edge.targetId,
            path: [...current.path, edge.targetId],
            connections: [...current.connections, edge],
            weight: current.weight * edge.weight
          });
        }
      }
    }

    return null;
  }

  /**
   * Detect clusters using simple community detection
   */
  private detectClusters(): void {
    this.clusters = [];
    const visited = new Set<string>();

    for (const nodeId of this.graph.nodes) {
      if (visited.has(nodeId)) continue;

      const cluster = this.buildCluster(nodeId, visited);
      if (cluster.itemIds.length >= 3) {
        this.clusters.push(cluster);
      }
    }
  }

  /**
   * Build a cluster starting from a seed node
   */
  private buildCluster(seedId: string, visited: Set<string>): ConnectionCluster {
    const cluster: string[] = [seedId];
    visited.add(seedId);
    const queue = [seedId];
    const allKeywords = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const edges = this.graph.edges.get(nodeId) || [];

      // Get node content for keyword extraction
      const metadata = this.graph.nodeMetadata.get(nodeId);
      if (metadata) {
        extractKeywords(metadata.content, 5).forEach(k => allKeywords.add(k));
      }

      for (const edge of edges) {
        if (!visited.has(edge.targetId) && edge.weight >= 0.5) {
          visited.add(edge.targetId);
          cluster.push(edge.targetId);
          queue.push(edge.targetId);
        }
      }
    }

    // Calculate cluster cohesion
    const cohesion = this.calculateClusterCohesion(cluster);
    const keywords = Array.from(allKeywords).slice(0, 5);

    return {
      id: this.generateClusterId(),
      itemIds: cluster,
      theme: keywords.join(', '),
      keywords,
      cohesion,
      confidence: cohesion,
      detectedAt: Date.now()
    };
  }

  /**
   * Calculate cluster cohesion (average connection weight within cluster)
   */
  private calculateClusterCohesion(clusterNodes: string[]): number {
    let totalWeight = 0;
    let connectionCount = 0;

    for (const nodeId of clusterNodes) {
      const edges = this.graph.edges.get(nodeId) || [];
      for (const edge of edges) {
        if (clusterNodes.includes(edge.targetId)) {
          totalWeight += edge.weight;
          connectionCount++;
        }
      }
    }

    return connectionCount > 0 ? totalWeight / connectionCount : 0;
  }

  /**
   * Get connections for an item
   */
  getConnectionsForItem(
    itemId: string,
    options?: { types?: ConnectionType[]; minWeight?: number }
  ): Connection[] {
    const edges = this.graph.edges.get(itemId) || [];
    let filtered = edges;

    if (options?.types) {
      filtered = filtered.filter(conn => options.types!.includes(conn.type));
    }

    if (options?.minWeight !== undefined) {
      filtered = filtered.filter(conn => conn.weight >= options.minWeight!);
    }

    return filtered;
  }

  /**
   * Analyze an item for connections
   */
  analyzeItem(itemId: string): ConnectionAnalysis {
    const startTime = Date.now();
    const directConnections = this.getConnectionsForItem(itemId);
    const indirectConnections: ConnectionPath[] = [];
    const clusters = this.clusters.filter(c => c.itemIds.includes(itemId));

    // Find indirect connections (2-3 hops)
    const connectedNodes = new Set(directConnections.map(c => c.targetId));
    for (const nodeId of connectedNodes) {
      const secondHop = this.graph.edges.get(nodeId) || [];
      for (const edge of secondHop) {
        if (edge.targetId !== itemId && !connectedNodes.has(edge.targetId)) {
          const path = this.findPath(itemId, edge.targetId, 3);
          if (path && path.length > 1) {
            indirectConnections.push(path);
          }
        }
      }
    }

    return {
      itemId,
      directConnections,
      indirectConnections: indirectConnections.slice(0, 10),
      clusters,
      suggestions: this.generateSuggestions(itemId),
      analyzedAt: Date.now(),
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Generate connection suggestions
   */
  private generateSuggestions(itemId: string): Connection[] {
    // For now, return empty array
    // In a real implementation, we could use ML to suggest connections
    return [];
  }

  /**
   * Start background discovery
   */
  private startBackgroundDiscovery(): void {
    if (this.discoveryInterval) return;

    this.discoveryInterval = setInterval(() => {
      // Background discovery would be triggered by the store
      console.log('Background discovery tick');
    }, this.config.discoveryInterval);
  }

  /**
   * Stop background discovery
   */
  stopBackgroundDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConnectionDiscoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enableBackgroundDiscovery !== undefined) {
      if (newConfig.enableBackgroundDiscovery) {
        this.startBackgroundDiscovery();
      } else {
        this.stopBackgroundDiscovery();
      }
    }
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get all clusters
   */
  getClusters(): ConnectionCluster[] {
    return this.clusters;
  }

  /**
   * Get graph
   */
  getGraph(): ConnectionGraph {
    return this.graph;
  }

  /**
   * Clear all connections
   */
  clearAll(): void {
    this.connections.clear();
    this.graph = {
      nodes: new Set(),
      edges: new Map(),
      nodeMetadata: new Map()
    };
    this.clusters = [];
  }

  // Utility methods

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClusterId(): string {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatTimeDelta(delta: number): string {
    const days = Math.floor(delta / (24 * 60 * 60 * 1000));
    if (days === 0) return 'same day';
    if (days === 1) return '1 day apart';
    return `${days} days apart`;
  }
}

// Singleton instance
let instance: ConnectionService | null = null;

export function getConnectionService(): ConnectionService {
  if (!instance) {
    instance = new ConnectionService();
  }
  return instance;
}

export default ConnectionService;
