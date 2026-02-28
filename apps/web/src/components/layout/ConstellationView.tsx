/**
 * Constellation View Component
 * 
 * Main container for thought visualization.
 * Shows empty state initially, will contain thought nodes/connections.
 */

'use client';

import { useLayoutStore } from '@/hooks/useLayout';
import { useThoughtsStore } from '@/stores/thoughts-store';

export function ConstellationView() {
  const viewMode = useLayoutStore((state) => state.viewMode);
  const thoughts = useThoughtsStore((state) => state.thoughts);
  const deleteThought = useThoughtsStore((state) => state.deleteThought);

  // Show thoughts if we have any
  if (thoughts.length > 0) {
    return (
      <div className="constellation-view">
        <div className="constellation-view-content">
          <div className="thoughts-list">
            {thoughts.map((thought) => (
              <div 
                key={thought.id} 
                className="thought-card"
              >
                <div className="thought-content">
                  <span className="thought-type-badge">
                    {thought.type === 'voice' ? '🎤' : '💭'}
                  </span>
                  <p>{thought.content}</p>
                </div>
                <div className="thought-meta">
                  <span className="thought-time">
                    {new Date(thought.createdAt).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => deleteThought(thought.id)}
                    className="thought-delete"
                    aria-label="Delete thought"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="constellation-view">
      <div className="constellation-view-content">
        {/* Empty State */}
        <div className="constellation-empty-state">
          <svg
            className="w-24 h-24 mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="6" cy="8" r="1.5" fill="currentColor" />
            <circle cx="18" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="16" r="1.5" fill="currentColor" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          </svg>
          
          <h3 className="text-lg font-medium mb-2">
            {viewMode === 'constellation' && 'No thoughts captured yet'}
            {viewMode === 'timeline' && 'Your timeline is empty'}
            {viewMode === 'graph' && 'No connections to display'}
          </h3>
          
          <p className="text-sm max-w-md">
            {viewMode === 'constellation' && 'Start capturing thoughts using the input above. Your thoughts will appear here as interconnected nodes.'}
            {viewMode === 'timeline' && 'Your thoughts will appear in chronological order as you capture them.'}
            {viewMode === 'graph' && 'Connections between your thoughts will be visualized here as you build relationships.'}
          </p>
        </div>
      </div>
    </div>
  );
}
