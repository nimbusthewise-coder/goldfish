/**
 * Component to display recent captured thoughts
 */

'use client';

import { useEffect, useState } from 'react';
import { useThoughtsStore } from '@/stores/thoughts-store';
import type { Thought } from '@/types/thought';

export interface RecentThoughtsProps {
  limit?: number;
}

export function RecentThoughts({ limit = 5 }: RecentThoughtsProps) {
  const thoughts = useThoughtsStore((state) => state.getRecentThoughts(limit));
  const deleteThought = useThoughtsStore((state) => state.deleteThought);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSyncStatusColor = (status: Thought['syncStatus']) => {
    switch (status) {
      case 'synced':
        return 'text-green-500';
      case 'pending':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (thoughts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No thoughts captured yet</p>
        <p className="text-xs mt-1">Start capturing your ideas above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Recent Thoughts
      </h3>
      
      {thoughts.map((thought) => (
        <div
          key={thought.id}
          className="bg-card border border-border rounded-lg p-3 hover:border-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {thought.type === 'voice' && (
                  <svg
                    className="w-4 h-4 text-accent flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(thought.createdAt)}
                </span>
                <span className={`text-xs ${getSyncStatusColor(thought.syncStatus)}`}>
                  {thought.syncStatus}
                </span>
              </div>
              
              <p className="text-sm text-foreground break-words">
                {thought.content}
              </p>
              
              {thought.metadata.duration && (
                <div className="text-xs text-muted-foreground mt-1">
                  Duration: {Math.round(thought.metadata.duration / 1000)}s
                </div>
              )}
            </div>
            
            <button
              onClick={() => deleteThought(thought.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              title="Delete thought"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
