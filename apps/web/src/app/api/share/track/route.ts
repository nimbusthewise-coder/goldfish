/**
 * Share tracking API endpoint
 * Tracks share events and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackShareEvent, getShareAnalytics } from '@/services/share-service';

/**
 * POST /api/share/track - Track a share event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareId, type, metadata } = body;

    if (!shareId || !type) {
      return NextResponse.json(
        { error: 'Share ID and event type required' },
        { status: 400 }
      );
    }

    await trackShareEvent(shareId, type, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track share event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share/track - Get share analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID required' },
        { status: 400 }
      );
    }

    const analytics = await getShareAnalytics(shareId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
