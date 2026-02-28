/**
 * SharePreview component
 * Preview of how shared content will appear to recipients
 */

'use client';

import type { ShareLink } from '@/types/share';

export interface SharePreviewProps {
  /** Share link with metadata */
  link: ShareLink;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export function SharePreview({
  link,
  compact = false,
  className = '',
}: SharePreviewProps) {
  const { preview, metadata } = link;

  if (compact) {
    return (
      <div
        className={`
          border border-gray-200 dark:border-gray-700
          rounded-lg p-4
          bg-white dark:bg-gray-800
          ${className}
        `}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {preview.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {preview.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        border border-gray-200 dark:border-gray-700
        rounded-lg overflow-hidden
        bg-white dark:bg-gray-800
        shadow-sm
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Goldfish
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Shared thought
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {preview.title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {preview.description}
        </p>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {metadata.wonderScore !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
              Wonder: {metadata.wonderScore.toFixed(2)}
            </span>
          )}
          {metadata.connectionIds && metadata.connectionIds.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {metadata.connectionIds.length} connection
              {metadata.connectionIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Footer with view count */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {metadata.views} view{metadata.views !== 1 ? 's' : ''}
            </span>
            <span>
              {new Date(metadata.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            View full context →
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal preview for inline display
 */
export function SharePreviewMinimal({ link }: { link: ShareLink }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {link.preview.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {link.url}
        </p>
      </div>
    </div>
  );
}
