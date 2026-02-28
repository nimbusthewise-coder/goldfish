/**
 * Agent Memory component
 * Displays memory insights, patterns, and agent activity
 */

'use client';

import React, { useState } from 'react';
import { useMemoryInsights, useMemoryStats } from '@/hooks/useMemoryInsights';
import { MemoryInsight } from './MemoryInsight';
import type { MemoryInsight as MemoryInsightType } from '@/types/memory';

interface AgentMemoryProps {
  currentThought?: string;
  recentThoughts?: string[];
  activeTags?: string[];
  compact?: boolean;
}

export function AgentMemory({
  currentThought,
  recentThoughts = [],
  activeTags = [],
  compact = false
}: AgentMemoryProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'stats'>('insights');
  
  const {
    insights,
    connectionInsights,
    patternInsights,
    reminderInsights,
    suggestionInsights,
    unshownInsights,
    isLoading,
    error,
    refresh,
    dismiss,
    markShown
  } = useMemoryInsights({
    currentThought,
    recentThoughts,
    activeTags,
    enabled: true
  });

  const stats = useMemoryStats();

  if (compact) {
    return (
      <CompactView
        insights={insights}
        unshownCount={unshownInsights.length}
        onDismiss={dismiss}
        onMarkShown={markShown}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Agent Memory
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.totalMemories} memories • {stats.totalPatterns} patterns
            </p>
          </div>
        </div>

        <button
          onClick={() => refresh()}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          aria-label="Refresh insights"
        >
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
          count={insights.length}
        >
          Insights
        </TabButton>
        <TabButton
          active={activeTab === 'patterns'}
          onClick={() => setActiveTab('patterns')}
          count={stats.totalPatterns}
        >
          Patterns
        </TabButton>
        <TabButton
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </TabButton>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-red-800 dark:text-red-300">
              Failed to load insights: {error.message}
            </p>
          </div>
        )}

        {activeTab === 'insights' && (
          <InsightsView
            insights={insights}
            connectionInsights={connectionInsights}
            patternInsights={patternInsights}
            reminderInsights={reminderInsights}
            suggestionInsights={suggestionInsights}
            isLoading={isLoading}
            onDismiss={dismiss}
            onMarkShown={markShown}
          />
        )}

        {activeTab === 'patterns' && (
          <PatternsView stats={stats} />
        )}

        {activeTab === 'stats' && (
          <StatsView stats={stats} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  count
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 font-medium text-sm rounded-t-lg transition-colors
        ${active
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  );
}

function InsightsView({
  insights,
  connectionInsights,
  patternInsights,
  reminderInsights,
  suggestionInsights,
  isLoading,
  onDismiss,
  onMarkShown
}: {
  insights: MemoryInsightType[];
  connectionInsights: MemoryInsightType[];
  patternInsights: MemoryInsightType[];
  reminderInsights: MemoryInsightType[];
  suggestionInsights: MemoryInsightType[];
  isLoading: boolean;
  onDismiss: (id: string) => void;
  onMarkShown: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | MemoryInsightType['type']>('all');

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.type === filter);

  if (isLoading && insights.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No insights yet. Keep capturing thoughts to see patterns emerge.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({insights.length})
        </FilterButton>
        {connectionInsights.length > 0 && (
          <FilterButton active={filter === 'connection'} onClick={() => setFilter('connection')}>
            🔗 Connections ({connectionInsights.length})
          </FilterButton>
        )}
        {patternInsights.length > 0 && (
          <FilterButton active={filter === 'pattern'} onClick={() => setFilter('pattern')}>
            🔍 Patterns ({patternInsights.length})
          </FilterButton>
        )}
        {reminderInsights.length > 0 && (
          <FilterButton active={filter === 'reminder'} onClick={() => setFilter('reminder')}>
            💭 Reminders ({reminderInsights.length})
          </FilterButton>
        )}
        {suggestionInsights.length > 0 && (
          <FilterButton active={filter === 'suggestion'} onClick={() => setFilter('suggestion')}>
            💡 Suggestions ({suggestionInsights.length})
          </FilterButton>
        )}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {filteredInsights.map(insight => (
          <MemoryInsight
            key={insight.id}
            insight={insight}
            onDismiss={onDismiss}
            onMarkShown={onMarkShown}
          />
        ))}
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        ${active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
    </button>
  );
}

function PatternsView({ stats }: { stats: any }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Pattern Detection Active
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {stats.totalPatterns} patterns detected across your thoughts
        </p>
      </div>
    </div>
  );
}

function StatsView({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Total Memories"
        value={stats.totalMemories}
        icon="🧠"
      />
      <StatCard
        label="Patterns Detected"
        value={stats.totalPatterns}
        icon="🔍"
      />
      <StatCard
        label="Insights Generated"
        value={stats.totalInsights}
        icon="💡"
      />
      <StatCard
        label="Average Confidence"
        value={`${Math.round(stats.averageConfidence * 100)}%`}
        icon="📊"
      />
      {stats.oldestMemory && (
        <StatCard
          label="Retention Period"
          value={formatRetentionPeriod(stats.oldestMemory)}
          icon="⏱️"
        />
      )}
      <StatCard
        label="Storage Size"
        value={formatBytes(stats.storageSize)}
        icon="💾"
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function CompactView({
  insights,
  unshownCount,
  onDismiss,
  onMarkShown
}: {
  insights: MemoryInsightType[];
  unshownCount: number;
  onDismiss: (id: string) => void;
  onMarkShown: (id: string) => void;
}) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {unshownCount > 0 && (
        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
          {unshownCount} new insight{unshownCount !== 1 ? 's' : ''}
        </div>
      )}
      {insights.slice(0, 3).map(insight => (
        <MemoryInsight
          key={insight.id}
          insight={insight}
          onDismiss={onDismiss}
          onMarkShown={onMarkShown}
        />
      ))}
    </div>
  );
}

function formatRetentionPeriod(oldestTimestamp: number): string {
  const days = Math.floor((Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
