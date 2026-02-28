/**
 * Connection Discovery Types
 * Represents relationships and connections between thoughts and memories
 */

export type ConnectionType = 'semantic' | 'temporal' | 'contextual' | 'categorical';

export interface Connection {
  /** Unique identifier */
  id: string;
  /** Source item (thought or memory ID) */
  sourceId: string;
  /** Target item (thought or memory ID) */
  targetId: string;
  /** Type of connection */
  type: ConnectionType;
  /** Connection strength/weight (0-1) */
  weight: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for this connection */
  reason: string;
  /** Shared themes or keywords */
  sharedThemes: string[];
  /** When this connection was discovered */
  discoveredAt: number;
  /** Whether user has confirmed this connection */
  confirmed: boolean;
  /** Whether user has dismissed this connection */
  dismissed: boolean;
  /** Number of times this connection was shown */
  viewCount: number;
  /** Last time this connection was viewed */
  lastViewedAt?: number;
  /** Metadata for additional context */
  metadata?: {
    /** Similarity score for semantic connections */
    similarityScore?: number;
    /** Time distance for temporal connections */
    timeDelta?: number;
    /** Shared context tags */
    sharedTags?: string[];
    /** Connection path for indirect connections */
    path?: string[];
  };
}

export interface ConnectionGraph {
  /** All nodes (thought/memory IDs) */
  nodes: Set<string>;
  /** Adjacency list for connections */
  edges: Map<string, Connection[]>;
  /** Metadata for each node */
  nodeMetadata: Map<string, NodeMetadata>;
}

export interface NodeMetadata {
  /** Node ID */
  id: string;
  /** Content preview */
  contentPreview: string;
  /** Full content */
  content: string;
  /** Node type */
  type: 'thought' | 'memory';
  /** Timestamp */
  timestamp: number;
  /** Tags */
  tags: string[];
  /** Wonder score if available */
  wonderScore?: number;
  /** Connection count (degree) */
  connectionCount: number;
  /** Clustering coefficient (how connected neighbors are) */
  clusteringCoefficient: number;
}

export interface ConnectionCluster {
  /** Unique identifier */
  id: string;
  /** IDs of items in this cluster */
  itemIds: string[];
  /** Central theme of the cluster */
  theme: string;
  /** Keywords that define this cluster */
  keywords: string[];
  /** Average connection strength within cluster */
  cohesion: number;
  /** Confidence in this cluster */
  confidence: number;
  /** When this cluster was detected */
  detectedAt: number;
}

export interface ConnectionPath {
  /** Path nodes from source to target */
  path: string[];
  /** Total path weight/strength */
  weight: number;
  /** Connections along the path */
  connections: Connection[];
  /** Path length */
  length: number;
}

export interface ConnectionSearchQuery {
  /** Item ID to search from */
  itemId: string;
  /** Maximum depth to search */
  maxDepth?: number;
  /** Minimum connection weight */
  minWeight?: number;
  /** Filter by connection types */
  types?: ConnectionType[];
  /** Limit results */
  limit?: number;
}

export interface ConnectionDiscoveryConfig {
  /** Minimum similarity threshold for semantic connections */
  minSemanticSimilarity: number;
  /** Maximum time delta for temporal connections (milliseconds) */
  maxTemporalDelta: number;
  /** Minimum shared tags for contextual connections */
  minSharedTags: number;
  /** Batch size for processing */
  batchSize: number;
  /** Enable background discovery */
  enableBackgroundDiscovery: boolean;
  /** Discovery interval (milliseconds) */
  discoveryInterval: number;
}

export interface ConnectionAnalysis {
  /** Item being analyzed */
  itemId: string;
  /** Direct connections */
  directConnections: Connection[];
  /** Indirect connections (2+ hops) */
  indirectConnections: ConnectionPath[];
  /** Clusters this item belongs to */
  clusters: ConnectionCluster[];
  /** Suggested new connections */
  suggestions: Connection[];
  /** Analysis timestamp */
  analyzedAt: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

export interface ConnectionStats {
  /** Total number of connections */
  totalConnections: number;
  /** Connections by type */
  connectionsByType: Record<ConnectionType, number>;
  /** Average connection weight */
  averageWeight: number;
  /** Number of confirmed connections */
  confirmedConnections: number;
  /** Number of dismissed connections */
  dismissedConnections: number;
  /** Total clusters detected */
  totalClusters: number;
  /** Average cluster size */
  averageClusterSize: number;
  /** Graph density (actual edges / possible edges) */
  graphDensity: number;
  /** Number of isolated nodes */
  isolatedNodes: number;
  /** Largest connected component size */
  largestComponentSize: number;
}

export interface ConnectionStoreState {
  /** All connections */
  connections: Map<string, Connection>;
  /** Connection graph */
  graph: ConnectionGraph;
  /** Detected clusters */
  clusters: ConnectionCluster[];
  /** Discovery configuration */
  config: ConnectionDiscoveryConfig;
  /** Whether discovery is running */
  isDiscovering: boolean;
  /** Last discovery timestamp */
  lastDiscoveryAt?: number;
  /** Processing queue */
  processingQueue: string[];

  // Actions
  /** Add a new connection */
  addConnection: (connection: Omit<Connection, 'id' | 'discoveredAt' | 'viewCount'>) => Connection;
  /** Get a connection by ID */
  getConnection: (id: string) => Connection | undefined;
  /** Get all connections for an item */
  getConnectionsForItem: (itemId: string, options?: { types?: ConnectionType[]; minWeight?: number }) => Connection[];
  /** Find path between two items */
  findPath: (sourceId: string, targetId: string, maxDepth?: number) => ConnectionPath | null;
  /** Search connections */
  searchConnections: (query: ConnectionSearchQuery) => Connection[];
  /** Confirm a connection */
  confirmConnection: (connectionId: string) => void;
  /** Dismiss a connection */
  dismissConnection: (connectionId: string) => void;
  /** Get connection analysis for an item */
  analyzeItem: (itemId: string) => ConnectionAnalysis;
  /** Get all clusters */
  getClusters: () => ConnectionCluster[];
  /** Get cluster for an item */
  getClusterForItem: (itemId: string) => ConnectionCluster | undefined;
  /** Get connection statistics */
  getStats: () => ConnectionStats;
  /** Update discovery configuration */
  updateConfig: (config: Partial<ConnectionDiscoveryConfig>) => void;
  /** Trigger manual discovery */
  discoverConnections: () => Promise<void>;
  /** Clear all connections */
  clearAll: () => void;
  /** Export connections */
  exportConnections: () => string;
  /** Import connections */
  importConnections: (data: string) => void;
}
