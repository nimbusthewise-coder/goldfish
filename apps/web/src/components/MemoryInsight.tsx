/**
 * Individual memory insight display component
 * Shows a single insight with appropriate styling and actions
 */

'use client';

import React, { useEffect } from 'react';
import type { MemoryInsight } from '@/types/memory';

interface MemoryInsightProps {
  insight: MemoryInsight;
  onDismiss: (id: string) => void;
  onMarkShown: (id: string) => void;
  autoMarkShown?: boolean;
}

const INSIGHT_TYPE_ICONS: Record<MemoryInsight['type'], string> = {
  connection: '🔗',
  pattern: '🔍',
  reminder: '💭',
  suggestion: '💡'
};

const INSIGHT_TYPE_COLORS: Record<MemoryInsight['type'], string> = {
  connection: 'border-blue-500/30 bg-blue-500/5',
  pattern: 'border-purple-500/30 bg-purple-500/5',
  reminder: 'border-yellow-500/30 bg-yellow-500/5',
  suggestion: 'border-green-500/30 bg-green-500/5'
};

const INSIGHT_TYPE_LABELS: Record<MemoryInsight['type'], string> = {
  connection: 'Connection',
  pattern: 'Pattern',
  reminder: 'Reminder',
  suggestion: 'Suggestion'
};

export function MemoryInsight({
  insight,
  onDismiss,
  onMarkShown,
  autoMarkShown = true
}: MemoryInsightProps) {
  useEffect(() => {
    if (autoMarkShown && !insight.shown) {
      onMarkShown(insight.id);
    }
  }, [insight.id, insight.shown, autoMarkShown, onMarkShown]);

  const handleDismiss = () => {
    onDismiss(insight.id);
  };

  const confidencePercentage = Math.round(insight.confidence * 100);

  return (
    <div
      className={`
        relative rounded-lg border p-4 mb-3
        transition-all duration-300 ease-in-out
        hover:shadow-md
        ${INSIGHT_TYPE_COLORS[insight.type]}
        ${!insight.shown ? 'animate-fade-in' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={insight.type}>
            {INSIGHT_TYPE_ICONS[insight.type]}
          </span>
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {INSIGHT_TYPE_LABELS[insight.type]}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {confidencePercentage}% confidence
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss insight"
        >
          <svg
            className="w-5 h-5"
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

      {/* Message */}
      <p className="text-gray-800 dark:text-gray-200 mb-3">
        {insight.message}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatTimestamp(insight.generatedAt)}</span>
        </div>

        {insight.relatedMemories.length > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            <span>{insight.relatedMemories.length} related</span>
          </div>
        )}

        {insight.relatedPatterns && insight.relatedPatterns.length > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span>{insight.relatedPatterns.length} patterns</span>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getConfidenceColor(insight.confidence)}`}
          style={{ width: `${confidencePercentage}%` }}
        />
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-blue-500';
  if (confidence >= 0.4) return 'bg-yellow-500';
  return 'bg-gray-400';
}
