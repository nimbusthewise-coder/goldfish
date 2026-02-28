/**
 * Memory system types for long-term thought pattern tracking
 */

export interface Memory {
  /** Unique identifier */
  id: string;
  /** The thought content being remembered */
  content: string;
  /** Reference to the original thought ID */
  thoughtId: string;
  /** Vector embedding for semantic search */
  embedding?: number[];
  /** When this memory was created */
  createdAt: number;
  /** When this memory was last accessed */
  lastAccessedAt: number;
  /** Number of times this memory has been accessed */
  accessCount: number;
  /** Confidence score (0-1) for this memory's importance */
  confidence: number;
  /** Related memory IDs discovered through pattern matching */
  relatedMemories: string[];
  /** Tags extracted from the thought */
  tags: string[];
  /** Metadata for context */
  metadata: {
    /** Original timestamp of the thought */
    timestamp: number;
    /** Wonder score if available */
    wonderScore?: number;
    /** User-assigned tags */
    userTags?: string[];
    /** Detected themes */
    themes?: string[];
  };
}

export interface MemoryPattern {
  /** Unique identifier */
  id: string;
  /** Pattern description */
  description: string;
  /** Memory IDs that form this pattern */
  memoryIds: string[];
  /** Confidence score (0-1) for pattern strength */
  confidence: number;
  /** Pattern type */
  type: 'temporal' | 'semantic' | 'thematic' | 'recurring';
  /** When this pattern was first detected */
  detectedAt: number;
  /** When this pattern was last updated */
  updatedAt: number;
  /** Number of times this pattern has been observed */
  occurrences: number;
  /** Keywords or themes that define this pattern */
  themes: string[];
}

export interface MemoryInsight {
  /** Unique identifier */
  id: string;
  /** Type of insight */
  type: 'connection' | 'pattern' | 'reminder' | 'suggestion';
  /** Human-readable insight message */
  message: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Related memory IDs */
  relatedMemories: string[];
  /** Related pattern IDs if applicable */
  relatedPatterns?: string[];
  /** When this insight was generated */
  generatedAt: number;
  /** Whether this insight has been shown to the user */
  shown: boolean;
  /** Whether the user dismissed this insight */
  dismissed: boolean;
  /** Context that triggered this insight */
  triggerContext?: string;
}

export interface MemorySearchQuery {
  /** Text query for semantic search */
  query: string;
  /** Maximum number of results */
  limit?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Filter by tags */
  tags?: string[];
  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface MemorySearchResult {
  /** The matched memory */
  memory: Memory;
  /** Similarity score (0-1) */
  similarity: number;
  /** Reason for match */
  matchReason: string;
}

export interface MemoryContext {
  /** Current thought being processed */
  currentThought?: string;
  /** Recent thoughts for context window */
  recentThoughts: string[];
  /** Active tags */
  activeTags: string[];
  /** Current time window (in milliseconds) */
  timeWindow: number;
}

export interface MemoryStats {
  /** Total number of memories stored */
  totalMemories: number;
  /** Number of patterns detected */
  totalPatterns: number;
  /** Number of insights generated */
  totalInsights: number;
  /** Average memory confidence */
  averageConfidence: number;
  /** Oldest memory timestamp */
  oldestMemory?: number;
  /** Most recent memory timestamp */
  newestMemory?: number;
  /** Storage size estimate (bytes) */
  storageSize: number;
  /** Cache hit rate */
  cacheHitRate: number;
}

export interface MemoryStoreState {
  /** All memories */
  memories: Map<string, Memory>;
  /** Detected patterns */
  patterns: Map<string, MemoryPattern>;
  /** Generated insights */
  insights: MemoryInsight[];
  /** LRU cache for frequently accessed memories */
  cache: Map<string, Memory>;
  /** Maximum cache size */
  maxCacheSize: number;
  /** Whether background processing is active */
  isProcessing: boolean;
  /** Last processing timestamp */
  lastProcessedAt?: number;

  // Actions
  /** Add a new memory */
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>) => Promise<Memory>;
  /** Get a memory by ID */
  getMemory: (id: string) => Memory | undefined;
  /** Search memories semantically */
  searchMemories: (query: MemorySearchQuery) => Promise<MemorySearchResult[]>;
  /** Get related memories for a given memory */
  getRelatedMemories: (memoryId: string, limit?: number) => Promise<Memory[]>;
  /** Update memory metadata */
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  /** Delete a memory */
  deleteMemory: (id: string) => void;
  /** Get all patterns */
  getPatterns: () => MemoryPattern[];
  /** Get insights for current context */
  getInsights: (context: MemoryContext) => Promise<MemoryInsight[]>;
  /** Dismiss an insight */
  dismissInsight: (insightId: string) => void;
  /** Mark insight as shown */
  markInsightShown: (insightId: string) => void;
  /** Get memory statistics */
  getStats: () => MemoryStats;
  /** Clear all memories (for privacy) */
  clearAll: () => void;
  /** Export memories for backup */
  exportMemories: () => Promise<string>;
  /** Import memories from backup */
  importMemories: (data: string) => Promise<void>;
}

export interface EmbeddingConfig {
  /** Embedding model to use */
  model: 'local' | 'openai';
  /** Vector dimensions */
  dimensions: number;
  /** API key if using OpenAI */
  apiKey?: string;
}

export interface PatternDetectionConfig {
  /** Minimum similarity threshold for semantic connections */
  minSimilarity: number;
  /** Minimum pattern confidence */
  minPatternConfidence: number;
  /** Time window for temporal patterns (milliseconds) */
  temporalWindow: number;
  /** Minimum occurrences to form a pattern */
  minOccurrences: number;
}
