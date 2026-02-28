/**
 * Share service
 * Handles share generation, storage, and tracking
 */

import type {
  ShareContext,
  ShareLink,
  ShareMetadata,
  RecipientViewData,
  CreateShareRequest,
  CreateShareResponse,
  ShareEvent,
} from '@/types/share';
import type { Thought } from '@/types/thought';
import { generateShareLink, generatePlatformUrl } from '@/lib/share/link-generator';
import { generateShareId, isShareExpired } from '@/lib/share/metadata-encoder';

/**
 * In-memory storage for shares (in production, this would be a database)
 */
class ShareStorage {
  private shares: Map<string, {
    metadata: ShareMetadata;
    context: ShareContext;
    events: ShareEvent[];
  }> = new Map();
  
  save(shareId: string, metadata: ShareMetadata, context: ShareContext): void {
    this.shares.set(shareId, {
      metadata,
      context,
      events: [],
    });
  }
  
  get(shareId: string): { metadata: ShareMetadata; context: ShareContext } | null {
    const data = this.shares.get(shareId);
    return data ? { metadata: data.metadata, context: data.context } : null;
  }
  
  incrementViews(shareId: string): void {
    const data = this.shares.get(shareId);
    if (data) {
      data.metadata.views++;
    }
  }
  
  addEvent(shareId: string, event: ShareEvent): void {
    const data = this.shares.get(shareId);
    if (data) {
      data.events.push(event);
    }
  }
  
  getEvents(shareId: string): ShareEvent[] {
    const data = this.shares.get(shareId);
    return data?.events || [];
  }
  
  getAllShares(): Array<{ metadata: ShareMetadata; context: ShareContext }> {
    return Array.from(this.shares.values()).map(({ metadata, context }) => ({
      metadata,
      context,
    }));
  }
  
  delete(shareId: string): void {
    this.shares.delete(shareId);
  }
  
  clear(): void {
    this.shares.clear();
  }
}

const storage = new ShareStorage();

/**
 * Create a new share
 */
export async function createShare(
  request: CreateShareRequest
): Promise<CreateShareResponse> {
  const startTime = performance.now();
  const shareId = generateShareId();
  
  // Generate share link
  const link = await generateShareLink(request.context, {
    shareId,
    expiresIn: request.expiresIn,
  });
  
  // Save to storage
  storage.save(shareId, link.metadata, request.context);
  
  // Track creation event
  const event: ShareEvent = {
    id: generateShareId(),
    shareId,
    type: 'created',
    timestamp: Date.now(),
    metadata: {
      platforms: request.platforms || [],
    },
  };
  storage.addEvent(shareId, event);
  
  const estimatedTime = performance.now() - startTime;
  
  return {
    shareId,
    link,
    estimatedTime,
  };
}

/**
 * Get share data for recipient view
 */
export async function getRecipientViewData(
  shareId: string
): Promise<RecipientViewData | null> {
  const data = storage.get(shareId);
  
  if (!data) {
    return null;
  }
  
  const { metadata, context } = data;
  
  // Check if expired
  const expired = isShareExpired(metadata);
  
  // Increment view count
  if (!expired) {
    storage.incrementViews(shareId);
    
    // Track view event
    const event: ShareEvent = {
      id: generateShareId(),
      shareId,
      type: 'viewed',
      timestamp: Date.now(),
    };
    storage.addEvent(shareId, event);
  }
  
  return {
    metadata,
    thought: context.thought,
    connectedThoughts: context.connectedThoughts,
    note: context.note,
    connectionType: context.connection?.type,
    isExpired: expired,
  };
}

/**
 * Track share event
 */
export async function trackShareEvent(
  shareId: string,
  type: ShareEvent['type'],
  metadata?: Record<string, any>
): Promise<void> {
  const event: ShareEvent = {
    id: generateShareId(),
    shareId,
    type,
    timestamp: Date.now(),
    metadata,
  };
  
  storage.addEvent(shareId, event);
}

/**
 * Get share analytics
 */
export async function getShareAnalytics(shareId: string): Promise<{
  views: number;
  shares: number;
  clicks: number;
  events: ShareEvent[];
}> {
  const data = storage.get(shareId);
  
  if (!data) {
    return { views: 0, shares: 0, clicks: 0, events: [] };
  }
  
  const events = storage.getEvents(shareId);
  
  return {
    views: data.metadata.views,
    shares: events.filter(e => e.type === 'shared').length,
    clicks: events.filter(e => e.type === 'clicked').length,
    events,
  };
}

/**
 * Get all user's shares
 */
export async function getUserShares(): Promise<ShareMetadata[]> {
  const allShares = storage.getAllShares();
  return allShares
    .map(s => s.metadata)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete a share
 */
export async function deleteShare(shareId: string): Promise<boolean> {
  const data = storage.get(shareId);
  if (!data) {
    return false;
  }
  
  storage.delete(shareId);
  return true;
}

/**
 * Clean up expired shares
 */
export async function cleanupExpiredShares(): Promise<number> {
  const allShares = storage.getAllShares();
  let deletedCount = 0;
  
  for (const { metadata } of allShares) {
    if (isShareExpired(metadata)) {
      storage.delete(metadata.shareId);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

/**
 * Generate platform-specific share URL
 */
export async function getplatformShareUrl(
  shareId: string,
  platform: 'twitter' | 'email'
): Promise<string | null> {
  const data = storage.get(shareId);
  
  if (!data) {
    return null;
  }
  
  const link = await generateShareLink(data.context, { shareId });
  return generatePlatformUrl(link, platform);
}

/**
 * Validate share access
 */
export function validateShareAccess(shareId: string): {
  valid: boolean;
  reason?: string;
} {
  const data = storage.get(shareId);
  
  if (!data) {
    return { valid: false, reason: 'Share not found' };
  }
  
  if (isShareExpired(data.metadata)) {
    return { valid: false, reason: 'Share has expired' };
  }
  
  return { valid: true };
}

/**
 * Get storage instance (for testing/debugging)
 */
export function getStorage(): ShareStorage {
  return storage;
}
