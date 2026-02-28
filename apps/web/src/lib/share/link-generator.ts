/**
 * Shareable link generation
 * Creates URLs with embedded metadata for frictionless sharing
 */

import type { ShareContext, ShareLink, SharePreviewData, ShareMetadata } from '@/types/share';
import { encodeShareMetadata, generateShareId, encodeToUrlSafe } from './metadata-encoder';

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3021';
}

/**
 * Generate preview data for rich link sharing
 */
function generatePreviewData(context: ShareContext): SharePreviewData {
  const { thought, connection, note } = context;
  
  // Create compelling title
  const title = note || thought.content.substring(0, 60) + (thought.content.length > 60 ? '...' : '');
  
  // Create description
  let description = `Wonder score: ${(thought.wonderScore || 0).toFixed(2)}`;
  if (connection) {
    description += ` • Connected thought`;
  }
  if (thought.analysis?.isCuriosityMoment) {
    description += ` • Curiosity moment`;
  }
  
  return {
    title,
    description,
    platformMetadata: {
      'og:type': 'article',
      'og:site_name': 'Goldfish',
      'twitter:card': 'summary_large_image',
    },
  };
}

/**
 * Generate a shareable link from context
 */
export async function generateShareLink(
  context: ShareContext,
  options: {
    shareId?: string;
    expiresIn?: number;
  } = {}
): Promise<ShareLink> {
  const shareId = options.shareId || generateShareId();
  
  // Encode metadata
  const metadata = encodeShareMetadata(shareId, context);
  
  // Add expiry if specified
  if (options.expiresIn) {
    metadata.expiresAt = Date.now() + options.expiresIn;
  }
  
  // Generate URL
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/shared/${shareId}`;
  
  // Generate preview data
  const preview = generatePreviewData(context);
  
  return {
    url,
    metadata,
    preview,
  };
}

/**
 * Generate platform-specific share URLs
 */
export function generatePlatformUrl(
  link: ShareLink,
  platform: 'twitter' | 'email'
): string {
  const { url, preview } = link;
  
  switch (platform) {
    case 'twitter':
      const twitterText = encodeURIComponent(
        `${preview.title}\n\n${url}`
      );
      return `https://twitter.com/intent/tweet?text=${twitterText}`;
    
    case 'email':
      const subject = encodeURIComponent(preview.title);
      const body = encodeURIComponent(
        `${preview.title}\n\n${preview.description}\n\nView the thought: ${url}`
      );
      return `mailto:?subject=${subject}&body=${body}`;
    
    default:
      return url;
  }
}

/**
 * Copy link to clipboard
 */
export async function copyLinkToClipboard(url: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate share URL with encoded metadata (alternative compact format)
 */
export function generateCompactUrl(metadata: ShareMetadata): string {
  const baseUrl = getBaseUrl();
  const encoded = encodeToUrlSafe(metadata);
  return `${baseUrl}/s/${encoded}`;
}

/**
 * Extract share ID from URL
 */
export function extractShareIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Format: /shared/{shareId} or /s/{encoded}
    if (pathParts[1] === 'shared' && pathParts[2]) {
      return pathParts[2];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate share URL format
 */
export function isValidShareUrl(url: string): boolean {
  return extractShareIdFromUrl(url) !== null;
}

/**
 * Generate meta tags for SEO and social sharing
 */
export function generateMetaTags(link: ShareLink): Record<string, string> {
  const { preview, url } = link;
  
  return {
    // Open Graph
    'og:title': preview.title,
    'og:description': preview.description,
    'og:url': url,
    'og:type': preview.platformMetadata?.['og:type'] || 'website',
    'og:site_name': preview.platformMetadata?.['og:site_name'] || 'Goldfish',
    
    // Twitter Card
    'twitter:card': preview.platformMetadata?.['twitter:card'] || 'summary',
    'twitter:title': preview.title,
    'twitter:description': preview.description,
    
    // Basic meta
    'description': preview.description,
  };
}
