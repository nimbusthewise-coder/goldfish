/**
 * Metadata encoder for shareable links
 * Encodes thought + connection context into compact, shareable format
 */

import type { ShareContext, ShareMetadata } from '@/types/share';

/**
 * Encode share context into compact metadata
 */
export function encodeShareMetadata(
  shareId: string,
  context: ShareContext
): ShareMetadata {
  const { thought, connectedThoughts, connection } = context;
  
  // Create preview text (first 150 chars of content)
  const preview = thought.content.length > 150
    ? thought.content.substring(0, 150) + '...'
    : thought.content;
  
  // Extract connection IDs
  const connectionIds = connectedThoughts?.map(t => t.id) || [];
  
  return {
    shareId,
    thoughtId: thought.id,
    preview,
    wonderScore: thought.wonderScore,
    connectionIds,
    createdAt: Date.now(),
    views: 0,
  };
}

/**
 * Encode share metadata into URL-safe string
 * Uses base64 encoding with URL-safe characters
 */
export function encodeToUrlSafe(metadata: ShareMetadata): string {
  const json = JSON.stringify(metadata);
  
  if (typeof window !== 'undefined' && typeof window.btoa !== 'undefined') {
    // Browser environment
    return btoa(json)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } else {
    // Node environment
    return Buffer.from(json)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

/**
 * Decode URL-safe string back to share metadata
 */
export function decodeFromUrlSafe(encoded: string): ShareMetadata | null {
  try {
    // Add back padding if needed
    let base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    while (base64.length % 4) {
      base64 += '=';
    }
    
    let json: string;
    if (typeof window !== 'undefined' && typeof window.atob !== 'undefined') {
      // Browser environment
      json = atob(base64);
    } else {
      // Node environment
      json = Buffer.from(base64, 'base64').toString('utf-8');
    }
    
    return JSON.parse(json) as ShareMetadata;
  } catch (error) {
    console.error('Failed to decode share metadata:', error);
    return null;
  }
}

/**
 * Generate a unique share ID
 */
export function generateShareId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
}

/**
 * Validate share metadata
 */
export function validateShareMetadata(metadata: ShareMetadata): boolean {
  return !!(
    metadata.shareId &&
    metadata.thoughtId &&
    metadata.preview &&
    metadata.createdAt
  );
}

/**
 * Check if share is expired
 */
export function isShareExpired(metadata: ShareMetadata): boolean {
  if (!metadata.expiresAt) {
    return false;
  }
  return Date.now() > metadata.expiresAt;
}

/**
 * Create expiry timestamp
 * @param durationMs Duration in milliseconds (default: 30 days)
 */
export function createExpiryTimestamp(durationMs: number = 30 * 24 * 60 * 60 * 1000): number {
  return Date.now() + durationMs;
}

/**
 * Compact encoding for very short URLs (optional)
 * Uses a more compact representation for minimal metadata
 */
export interface CompactShareData {
  t: string; // thought ID
  w?: number; // wonder score
  c?: string[]; // connection IDs
}

export function encodeCompact(metadata: ShareMetadata): string {
  const compact: CompactShareData = {
    t: metadata.thoughtId,
    w: metadata.wonderScore,
    c: metadata.connectionIds,
  };
  
  const json = JSON.stringify(compact);
  
  if (typeof window !== 'undefined' && typeof window.btoa !== 'undefined') {
    return btoa(json).replace(/=/g, '');
  } else {
    return Buffer.from(json).toString('base64').replace(/=/g, '');
  }
}

export function decodeCompact(encoded: string): CompactShareData | null {
  try {
    let json: string;
    if (typeof window !== 'undefined' && typeof window.atob !== 'undefined') {
      json = atob(encoded);
    } else {
      json = Buffer.from(encoded, 'base64').toString('utf-8');
    }
    return JSON.parse(json) as CompactShareData;
  } catch (error) {
    console.error('Failed to decode compact share data:', error);
    return null;
  }
}
