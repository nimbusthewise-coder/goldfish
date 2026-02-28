/**
 * Share API endpoints
 * Handles share creation, retrieval, and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createShare,
  getRecipientViewData,
  trackShareEvent,
  getShareAnalytics,
  deleteShare,
  getUserShares,
} from '@/services/share-service';
import type { CreateShareRequest } from '@/types/share';

/**
 * POST /api/share - Create a new share
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateShareRequest = await request.json();

    if (!body.context || !body.context.thought) {
      return NextResponse.json(
        { error: 'Invalid share context' },
        { status: 400 }
      );
    }

    const response = await createShare(body);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to create share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share - Get user's shares or specific share
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (shareId) {
      // Get specific share
      const data = await getRecipientViewData(shareId);

      if (!data) {
        return NextResponse.json(
          { error: 'Share not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    } else {
      // Get all user shares
      const shares = await getUserShares();
      return NextResponse.json({ shares });
    }
  } catch (error) {
    console.error('Failed to get share:', error);
    return NextResponse.json(
      { error: 'Failed to get share' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/share - Delete a share
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID required' },
        { status: 400 }
      );
    }

    const success = await deleteShare(shareId);

    if (!success) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
