/**
 * ShareTrigger component
 * Contextual share buttons that appear throughout the app
 */

'use client';

import { useState, useCallback } from 'react';
import type { Thought } from '@/types/thought';
import type { Connection } from '@/types/constellation';
import type { ShareContext } from '@/types/share';

export interface ShareTriggerProps {
  /** The thought to share */
  thought: Thought;
  /** Connected thoughts (optional) */
  connectedThoughts?: Thought[];
  /** Connection that triggered this (optional) */
  connection?: Connection;
  /** Trigger style variant */
  variant?: 'icon' | 'button' | 'hover';
  /** Size of trigger */
  size?: 'sm' | 'md' | 'lg';
  /** Callback when share is initiated */
  onShare?: (context: ShareContext) => void;
  /** Custom className */
  className?: string;
}

export function ShareTrigger({
  thought,
  connectedThoughts,
  connection,
  variant = 'icon',
  size = 'md',
  onShare,
  className = '',
}: ShareTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [justClicked, setJustClicked] = useState(false);

  const handleClick = useCallback(() => {
    const context: ShareContext = {
      thought,
      connectedThoughts,
      connection,
      discoveredAt: Date.now(),
    };

    onShare?.(context);

    // Visual feedback
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 200);
  }, [thought, connectedThoughts, connection, onShare]);

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-full
    transition-all duration-200
    cursor-pointer
    ${sizeClasses[size]}
    ${justClicked ? 'scale-90' : 'scale-100'}
    ${className}
  `;

  // Icon variant - minimal, appears on hover
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${baseClasses}
          bg-transparent
          hover:bg-blue-500/10
          text-blue-500
          ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        title="Share this thought"
        aria-label="Share this thought"
      >
        <svg
          className="w-4 h-4"
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
      </button>
    );
  }

  // Button variant - always visible
  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${baseClasses}
          px-4 py-2
          w-auto
          bg-blue-500
          hover:bg-blue-600
          text-white
          font-medium
          shadow-sm
          hover:shadow-md
        `}
        aria-label="Share this thought"
      >
        <svg
          className="w-4 h-4 mr-2"
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
        Share
      </button>
    );
  }

  // Hover variant - appears on hover over parent
  return (
    <button
      onClick={handleClick}
      className={`
        ${baseClasses}
        absolute top-2 right-2
        bg-white/90 dark:bg-gray-800/90
        hover:bg-blue-500
        hover:text-white
        text-gray-600 dark:text-gray-400
        shadow-sm
        opacity-0
        group-hover:opacity-100
        backdrop-blur-sm
      `}
      title="Share this thought"
      aria-label="Share this thought"
    >
      <svg
        className="w-4 h-4"
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
    </button>
  );
}

/**
 * Quick share button for immediate clipboard copy
 */
export function QuickShareButton({
  thought,
  className = '',
}: {
  thought: Thought;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleQuickShare = useCallback(async () => {
    // This would integrate with useQuickShare hook
    // For now, just show visual feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <button
      onClick={handleQuickShare}
      className={`
        relative
        px-3 py-1.5
        text-sm
        rounded-md
        bg-blue-500
        hover:bg-blue-600
        text-white
        transition-all
        ${className}
      `}
      aria-label="Quick share - copy link"
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4 inline mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 inline mr-1"
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
          Quick Share
        </>
      )}
    </button>
  );
}
