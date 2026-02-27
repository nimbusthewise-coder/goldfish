/**
 * Thought data structure with metadata for wonder detection analysis
 * Unified type for both existing features and wonder detection
 */

export type ThoughtType = 'text' | 'voice';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface WonderAnalysis {
  /** Confidence score between 0.0 and 1.0 indicating curiosity level */
  confidence: number;
  /** Whether this thought represents a curiosity moment */
  isCuriosityMoment: boolean;
  /** Detected question patterns */
  questionPatterns: string[];
  /** Matched curiosity keywords */
  matchedKeywords: string[];
  /** Emotional indicators detected (e.g., 'excitement', 'wonder') */
  emotionalIndicators: string[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Timestamp when analysis was performed */
  analyzedAt: Date;
  /** Version of the analysis algorithm used */
  algorithmVersion: string;
}

export interface Thought {
  /** Unique identifier */
  id: string;
  /** Type of thought (text or voice) */
  type: ThoughtType;
  /** The actual thought content */
  content: string;
  /** Raw audio data (for voice thoughts) */
  rawAudio?: Blob;
  /** Metadata about the thought */
  metadata: {
    /** Timestamp in milliseconds */
    timestamp: number;
    /** Device identifier */
    deviceId: string;
    /** Duration of voice recording in seconds */
    duration?: number;
    /** User agent string */
    userAgent?: string;
    /** User-assigned tags */
    tags?: string[];
    /** Confidence from wonder detection */
    confidence?: number;
    /** Category classification */
    category?: string;
    /** Connection IDs to other thoughts */
    connections?: string[];
  };
  /** Sync status for offline-first architecture */
  syncStatus: SyncStatus;
  /** When the thought was created (milliseconds) */
  createdAt: number;
  /** When the thought was last updated (milliseconds) */
  updatedAt: number;
  /** When the thought was synced */
  syncedAt?: number;
  /** Number of sync retry attempts */
  retryCount: number;
  /** Error message if sync failed */
  error?: string;
  /** Wonder detection analysis results (populated after analysis) */
  analysis?: WonderAnalysis;
  /** Keywords extracted from the thought */
  keywords?: string[];
  /** Wonder score (0-1) for constellation visualization */
  wonderScore?: number;
  /** Timestamp (Date object for compatibility) */
  timestamp?: Date;
}

export interface ThoughtCreateInput {
  type: ThoughtType;
  content: string;
  rawAudio?: Blob;
  duration?: number;
}

export interface ThoughtAnalysisRequest {
  thought: Thought;
  /** Whether to force reanalysis even if cached */
  forceReanalysis?: boolean;
}

export interface ThoughtAnalysisResponse {
  thought: Thought;
  analysis: WonderAnalysis;
  /** Whether this result came from cache */
  cached: boolean;
}

export interface AnalysisPerformanceMetrics {
  /** Average processing time in milliseconds */
  averageTime: number;
  /** Maximum processing time in milliseconds */
  maxTime: number;
  /** Minimum processing time in milliseconds */
  minTime: number;
  /** Total number of analyses performed */
  totalAnalyses: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Cache hit rate (0.0 to 1.0) */
  cacheHitRate: number;
}

/** Thoughts store state */
export interface ThoughtsState {
  /** All thoughts */
  thoughts: Thought[];
  /** Whether currently capturing */
  isCapturing: boolean;
  /** Last capture timestamp */
  lastCaptureTime?: number;
  /** Add a new thought */
  addThought: (input: ThoughtCreateInput) => Promise<Thought>;
  /** Update an existing thought */
  updateThought: (id: string, updates: Partial<Thought>) => void;
  /** Delete a thought */
  deleteThought: (id: string) => void;
  /** Get a thought by ID */
  getThought: (id: string) => Thought | undefined;
  /** Get recent thoughts */
  getRecentThoughts: (limit?: number) => Thought[];
  /** Get thoughts pending sync */
  getPendingSync: () => Thought[];
  /** Mark a thought as synced */
  markSynced: (id: string) => void;
  /** Mark a thought as sync failed */
  markSyncFailed: (id: string, error: string) => void;
  /** Clear all thoughts */
  clearAll: () => void;
}
