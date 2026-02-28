/**
 * Example: Thought card with integrated sharing
 * Shows how to integrate ShareTrigger into existing components
 */

'use client';

import { useState } from 'react';
import { ShareTrigger } from '../ShareTrigger';
import { ShareComposer } from '../ShareComposer';
import type { Thought } from '@/types/thought';
import type { ShareContext } from '@/types/share';

export interface ThoughtCardWithShareProps {
  thought: Thought;
  connectedThoughts?: Thought[];
}

export function ThoughtCardWithShare({
  thought,
  connectedThoughts,
}: ThoughtCardWithShareProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareContext, setShareContext] = useState<ShareContext | null>(null);

  const handleShare = (context: ShareContext) => {
    setShareContext(context);
    setIsShareOpen(true);
  };

  return (
    <>
      {/* Thought Card */}
      <div className="group relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        {/* Share trigger - appears on hover */}
        <ShareTrigger
          thought={thought}
          connectedThoughts={connectedThoughts}
          variant="hover"
          onShare={handleShare}
        />

        {/* Thought content */}
        <div className="pr-12">
          <p className="text-gray-900 dark:text-white mb-4">{thought.content}</p>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            {thought.wonderScore !== undefined && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-purple-500"
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
                {thought.wonderScore.toFixed(2)}
              </span>
            )}

            {connectedThoughts && connectedThoughts.length > 0 && (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {connectedThoughts.length} connection{connectedThoughts.length !== 1 ? 's' : ''}
              </span>
            )}

            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
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
              {new Date(thought.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Share Composer Modal */}
      {shareContext && (
        <ShareComposer
          context={shareContext}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          onComplete={() => {
            console.log('Share completed!');
          }}
        />
      )}
    </>
  );
}
