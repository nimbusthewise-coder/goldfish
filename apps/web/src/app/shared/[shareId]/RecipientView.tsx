/**
 * RecipientView component
 * Client component for displaying shared content to recipients
 */

'use client';

import { useEffect } from 'react';
import type { RecipientViewData } from '@/types/share';

export interface RecipientViewProps {
  data: RecipientViewData;
  shareId: string;
}

export function RecipientView({ data, shareId }: RecipientViewProps) {
  const { thought, connectedThoughts, note, connectionType, isExpired, metadata } = data;

  // Track view on mount
  useEffect(() => {
    if (!isExpired) {
      fetch('/api/share/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId,
          type: 'viewed',
        }),
      }).catch((error) => console.error('Failed to track view:', error));
    }
  }, [shareId, isExpired]);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-600 dark:text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Share Expired
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This shared thought is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Goldfish
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shared Thought
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Note (if provided) */}
          {note && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Note from sender
                  </p>
                  <p className="text-blue-800 dark:text-blue-300">{note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main thought */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Shared Thought
                </h2>
                {thought.wonderScore !== undefined && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <svg
                      className="w-4 h-4 text-purple-600 dark:text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                      Wonder: {thought.wonderScore.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {thought.content}
              </p>

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {new Date(metadata.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>

                  {thought.analysis?.isCuriosityMoment && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      Curiosity Moment
                    </span>
                  )}

                  {connectionType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {connectionType} connection
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connected thoughts */}
          {connectedThoughts && connectedThoughts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Connected Thoughts
              </h3>
              <div className="grid gap-4">
                {connectedThoughts.map((connectedThought) => (
                  <div
                    key={connectedThought.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-gray-700 dark:text-gray-300">
                      {connectedThought.content}
                    </p>
                    {connectedThought.wonderScore !== undefined && (
                      <div className="mt-3 flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg
                          className="w-4 h-4 mr-1.5 text-purple-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                        Wonder: {connectedThought.wonderScore.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Capture Your Own Thoughts
            </h3>
            <p className="text-blue-100 mb-6">
              Start discovering connections in your own thinking with Goldfish
            </p>
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Shared via Goldfish • {metadata.views} view{metadata.views !== 1 ? 's' : ''}</p>
        </div>
      </footer>
    </div>
  );
}
