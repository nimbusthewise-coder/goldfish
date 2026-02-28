/**
 * ShareComposer component
 * Modal for composing and customizing shares
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useShare } from '@/hooks/useShare';
import { SharePreview } from './SharePreview';
import type { ShareContext, SharePlatform } from '@/types/share';

export interface ShareComposerProps {
  /** Initial share context */
  context: ShareContext;
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when share is complete */
  onComplete?: () => void;
}

export function ShareComposer({
  context,
  isOpen,
  onClose,
  onComplete,
}: ShareComposerProps) {
  const [note, setNote] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SharePlatform[]>(['link']);

  const {
    initiateShare,
    share,
    copy,
    complete,
    cancel,
    isGenerating,
    activeShare,
    link,
    timeToComplete,
    isWithinGoal,
    goalPercentage,
  } = useShare({
    onComplete: () => {
      onComplete?.();
      onClose();
    },
  });

  // Initialize share when modal opens
  useEffect(() => {
    if (isOpen && !activeShare) {
      const contextWithNote = {
        ...context,
        note: note || undefined,
      };
      initiateShare(contextWithNote);
    }
  }, [isOpen, activeShare, context, note, initiateShare]);

  // Handle platform toggle
  const togglePlatform = useCallback((platform: SharePlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }, []);

  // Handle share to platform
  const handleShareToPlatform = useCallback(
    async (platform: SharePlatform) => {
      try {
        await share(platform);
      } catch (error) {
        console.error('Failed to share:', error);
      }
    },
    [share]
  );

  // Handle copy link
  const handleCopy = useCallback(async () => {
    const success = await copy();
    if (success) {
      // Show success feedback
      setTimeout(() => {
        complete();
      }, 1000);
    }
  }, [copy, complete]);

  // Handle close
  const handleClose = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  if (!isOpen) {
    return null;
  }

  const platforms: Array<{ id: SharePlatform; name: string; icon: string }> = [
    { id: 'link', name: 'Link', icon: '🔗' },
    { id: 'clipboard', name: 'Clipboard', icon: '📋' },
    { id: 'twitter', name: 'Twitter', icon: '𝕏' },
    { id: 'email', name: 'Email', icon: '✉️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Share Your Thought
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 30-second goal indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Time to share
              </span>
              <span
                className={`font-mono ${
                  isWithinGoal ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {(timeToComplete / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isWithinGoal ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(goalPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Preview */}
          {link && <SharePreview link={link} />}

          {/* Add note */}
          <div>
            <label
              htmlFor="share-note"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Add a note (optional)
            </label>
            <textarea
              id="share-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this thought interesting?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Platform selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Share to
            </label>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all
                    ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {platform.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Link display (when ready) */}
          {link && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shareable Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={link.url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => complete()}
              disabled={!link || isGenerating}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
