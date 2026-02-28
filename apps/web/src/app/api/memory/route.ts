/**
 * Memory API endpoints
 * RESTful API for memory operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryService } from '@/services/memory-service';

const memoryService = getMemoryService();

/**
 * GET /api/memory - Search memories or get all memories
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    if (query) {
      // Search memories
      const results = await memoryService.searchMemories({
        query,
        limit,
        minConfidence,
        tags
      });

      return NextResponse.json({
        success: true,
        data: results,
        count: results.length
      });
    } else {
      // Get statistics
      const stats = memoryService.getStats();
      const patterns = memoryService.getPatterns();

      return NextResponse.json({
        success: true,
        data: {
          stats,
          patterns: patterns.slice(0, 10) // Return top 10 patterns
        }
      });
    }
  } catch (error) {
    console.error('Memory GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memory - Create a new memory or get insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        // Create a memory from thought
        if (!data.thought) {
          return NextResponse.json(
            { success: false, error: 'Thought is required' },
            { status: 400 }
          );
        }

        const memory = await memoryService.processThought(data.thought);
        return NextResponse.json({
          success: true,
          data: memory
        });
      }

      case 'insights': {
        // Get insights for context
        const context = {
          currentThought: data.currentThought,
          recentThoughts: data.recentThoughts || [],
          activeTags: data.activeTags || [],
          timeWindow: data.timeWindow || 30 * 24 * 60 * 60 * 1000
        };

        const insights = await memoryService.getInsights(context);
        return NextResponse.json({
          success: true,
          data: insights
        });
      }

      case 'batch': {
        // Process multiple thoughts
        if (!Array.isArray(data.thoughts)) {
          return NextResponse.json(
            { success: false, error: 'Thoughts array is required' },
            { status: 400 }
          );
        }

        const memories = await memoryService.processThoughts(data.thoughts);
        return NextResponse.json({
          success: true,
          data: memories,
          count: memories.length
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memory - Clear all memories or dismiss insight
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const insightId = searchParams.get('insightId');

    if (insightId) {
      memoryService.dismissInsight(insightId);
      return NextResponse.json({
        success: true,
        message: 'Insight dismissed'
      });
    } else {
      memoryService.clearAll();
      return NextResponse.json({
        success: true,
        message: 'All memories cleared'
      });
    }
  } catch (error) {
    console.error('Memory DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/memory - Update memory or import/export
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'export': {
        const exportData = await memoryService.exportMemories();
        return NextResponse.json({
          success: true,
          data: exportData
        });
      }

      case 'import': {
        if (!data.memories) {
          return NextResponse.json(
            { success: false, error: 'Import data is required' },
            { status: 400 }
          );
        }

        await memoryService.importMemories(data.memories);
        return NextResponse.json({
          success: true,
          message: 'Memories imported successfully'
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
