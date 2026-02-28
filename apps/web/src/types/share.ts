/**
 * Share-related TypeScript interfaces
 * Supports curiosity transmission with full context preservation
 */

import type { Thought } from './thought';
import type { Connection } from './constellation';

export type ShareStatus = 'draft' | 'generating' | 'ready' | 'shared' | 'failed';
export type SharePlatform = 'link' | 'twitter' | 'email' | 'clipboard';

/**
 * Core share context - what gets transmitted
 */
export interface ShareContext {
  /** The primary thought being shared */
  thought: Thought;
  /** Connected thoughts that provide context */
  connectedThoughts?: Thought[];
  /** The specific connection that triggered the share (if any) */
  connection?: Connection;
  /** User's note/commentary on the share */
  note?: string;
  /** Timestamp when curiosity was discovered */
  discoveredAt: number;
}

/**
 * Encoded metadata for shareable links
 */
export interface ShareMetadata {
  /** Unique share identifier */
  shareId: string;
  /** Encoded thought content */
  thoughtId: string;
  /** Thought content preview */
  preview: string;
  /** Wonder score of the thought */
  wonderScore?: number;
  /** Connection context IDs */
  connectionIds?: string[];
  /** When the share was created */
  createdAt: number;
  /** Number of times this share has been viewed */
  views: number;
  /** Expiry timestamp (optional) */
  expiresAt?: number;
}

/**
 * Share link with all metadata
 */
export interface ShareLink {
  /** Full shareable URL */
  url: string;
  /** Short URL (if available) */
  shortUrl?: string;
  /** Share metadata */
  metadata: ShareMetadata;
  /** Platform-specific preview data */
  preview: SharePreviewData;
}

/**
 * Platform-specific preview data for rich link previews
 */
export interface SharePreviewData {
  /** Title for Open Graph/Twitter Card */
  title: string;
  /** Description for preview */
  description: string;
  /** Preview image URL (optional) */
  imageUrl?: string;
  /** Additional metadata for specific platforms */
  platformMetadata?: Record<string, any>;
}

/**
 * Share composition state
 */
export interface ShareComposition {
  /** Current share context */
  context: ShareContext;
  /** Status of share generation */
  status: ShareStatus;
  /** Generated share link (when ready) */
  link?: ShareLink;
  /** Selected platforms for sharing */
  selectedPlatforms: SharePlatform[];
  /** Error message if failed */
  error?: string;
  /** Timer for 30-second accessibility goal */
  startTime: number;
  /** Whether share is complete */
  isComplete: boolean;
}

/**
 * Share analytics event
 */
export interface ShareEvent {
  /** Event ID */
  id: string;
  /** Share ID being tracked */
  shareId: string;
  /** Type of event */
  type: 'created' | 'viewed' | 'clicked' | 'shared';
  /** Platform (for sharing events) */
  platform?: SharePlatform;
  /** Timestamp */
  timestamp: number;
  /** Additional context */
  metadata?: Record<string, any>;
}

/**
 * Share store state
 */
export interface ShareState {
  /** Active share compositions */
  activeShares: Map<string, ShareComposition>;
  /** Share history */
  shareHistory: ShareMetadata[];
  /** Share analytics */
  analytics: ShareEvent[];
  /** Whether currently generating a share */
  isGenerating: boolean;
  /** Last share time (for performance tracking) */
  lastShareTime?: number;
}

/**
 * Share store actions
 */
export interface ShareActions {
  /** Initiate a new share */
  startShare: (context: ShareContext) => string;
  /** Update share composition */
  updateShare: (shareId: string, updates: Partial<ShareComposition>) => void;
  /** Generate shareable link */
  generateLink: (shareId: string) => Promise<ShareLink>;
  /** Share to platform */
  shareToPlatform: (shareId: string, platform: SharePlatform) => Promise<void>;
  /** Copy link to clipboard */
  copyToClipboard: (shareId: string) => Promise<boolean>;
  /** Complete share and track */
  completeShare: (shareId: string) => void;
  /** Cancel share */
  cancelShare: (shareId: string) => void;
  /** Get share by ID */
  getShare: (shareId: string) => ShareComposition | undefined;
  /** Track analytics event */
  trackEvent: (event: Omit<ShareEvent, 'id' | 'timestamp'>) => void;
  /** Clear history */
  clearHistory: () => void;
}

/**
 * Recipient view data (public-facing)
 */
export interface RecipientViewData {
  /** Share metadata */
  metadata: ShareMetadata;
  /** The shared thought */
  thought: Thought;
  /** Connected thoughts (if included) */
  connectedThoughts?: Thought[];
  /** Sharer's note */
  note?: string;
  /** Connection that triggered share */
  connectionType?: string;
  /** Whether share is expired */
  isExpired: boolean;
}

/**
 * Share creation request
 */
export interface CreateShareRequest {
  context: ShareContext;
  platforms?: SharePlatform[];
  expiresIn?: number; // milliseconds
}

/**
 * Share creation response
 */
export interface CreateShareResponse {
  shareId: string;
  link: ShareLink;
  estimatedTime: number; // time to complete in ms
}
