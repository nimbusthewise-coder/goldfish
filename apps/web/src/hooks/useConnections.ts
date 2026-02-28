/**
 * useConnections Hook
 * React hook for accessing and managing connections
 */

import { useEffect, useState, useMemo } from 'react';
import { useConnectionStore } from '@/stores/connection-store';
import { getConnectionService } from '@/services/connection-service';
import type {
  Connection,
  ConnectionType,
  ConnectionAnalysis,
  ConnectionStats,
  ConnectionCluster
} from '@/types/connections';
import type { Thought } from '@/types/thought';
import type { Memory } from '@/types/memory';

/**
 * Hook to get connections for a specific item
 */
export function useItemConnections(
  itemId: string | undefined,
  options?: {
    types?: ConnectionType[];
    minWeight?: number;
    autoRefresh?: boolean;
  }
) {
  const getConnectionsForItem = useConnectionStore(state => state.getConnectionsForItem);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!itemId) {
      setConnections([]);
      return;
    }

    const fetchConnections = () => {
      const conns = getConnectionsForItem(itemId, {
        types: options?.types,
        minWeight: options?.minWeight
      });
      setConnections(conns);
    };

    fetchConnections();

    // Auto-refresh if enabled
    if (options?.autoRefresh) {
      const interval = setInterval(fetchConnections, 5000);
      return () => clearInterval(interval);
    }
  }, [itemId, options?.types, options?.minWeight, options?.autoRefresh, getConnectionsForItem]);

  return connections;
}

/**
 * Hook to analyze connections for an item
 */
export function useConnectionAnalysis(itemId: string | undefined) {
  const analyzeItem = useConnectionStore(state => state.analyzeItem);
  const [analysis, setAnalysis] = useState<ConnectionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    const result = analyzeItem(itemId);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [itemId, analyzeItem]);

  return { analysis, isAnalyzing };
}

/**
 * Hook to get connection statistics
 */
export function useConnectionStats() {
  const getStats = useConnectionStore(state => state.getStats);
  const [stats, setStats] = useState<ConnectionStats | null>(null);

  useEffect(() => {
    const updateStats = () => {
      const newStats = getStats();
      setStats(newStats);
    };

    updateStats();

    // Update stats periodically
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, [getStats]);

  return stats;
}

/**
 * Hook to get clusters
 */
export function useClusters() {
  const getClusters = useConnectionStore(state => state.getClusters);
  return getClusters();
}

/**
 * Hook to discover connections for new items
 */
export function useConnectionDiscovery() {
  const connectionService = getConnectionService();
  const [isDiscovering, setIsDiscovering] = useState(false);

  const discoverForItems = async (
    newItems: Array<{
      id: string;
      content: string;
      timestamp: number;
      tags?: string[];
      type: 'thought' | 'memory';
    }>,
    existingItems: Array<{
      id: string;
      content: string;
      timestamp: number;
      tags?: string[];
      type: 'thought' | 'memory';
    }>
  ): Promise<Connection[]> => {
    setIsDiscovering(true);
    try {
      const connections = await connectionService.discoverConnections(
        newItems,
        existingItems
      );
      return connections;
    } finally {
      setIsDiscovering(false);
    }
  };

  return { discoverForItems, isDiscovering };
}

/**
 * Hook to manage connections (confirm/dismiss)
 */
export function useConnectionActions() {
  const confirmConnection = useConnectionStore(state => state.confirmConnection);
  const dismissConnection = useConnectionStore(state => state.dismissConnection);

  return {
    confirm: confirmConnection,
    dismiss: dismissConnection
  };
}

/**
 * Hook to search connections
 */
export function useConnectionSearch(
  itemId: string | undefined,
  options?: {
    maxDepth?: number;
    minWeight?: number;
    types?: ConnectionType[];
    limit?: number;
  }
) {
  const searchConnections = useConnectionStore(state => state.searchConnections);
  const [results, setResults] = useState<Connection[]>([]);

  useEffect(() => {
    if (!itemId) {
      setResults([]);
      return;
    }

    const connections = searchConnections({
      itemId,
      ...options
    });
    setResults(connections);
  }, [itemId, options?.maxDepth, options?.minWeight, options?.types, options?.limit, searchConnections]);

  return results;
}

/**
 * Hook to get related items through connections
 */
export function useRelatedItems(
  itemId: string | undefined,
  options?: {
    types?: ConnectionType[];
    minWeight?: number;
    limit?: number;
  }
) {
  const connections = useItemConnections(itemId, options);

  const relatedItems = useMemo(() => {
    const items = connections
      .map(conn => ({
        itemId: conn.targetId,
        connection: conn
      }))
      .sort((a, b) => b.connection.weight - a.connection.weight);

    return options?.limit ? items.slice(0, options.limit) : items;
  }, [connections, options?.limit]);

  return relatedItems;
}

/**
 * Hook to get cluster for an item
 */
export function useItemCluster(itemId: string | undefined) {
  const getClusterForItem = useConnectionStore(state => state.getClusterForItem);
  const [cluster, setCluster] = useState<ConnectionCluster | undefined>();

  useEffect(() => {
    if (!itemId) {
      setCluster(undefined);
      return;
    }

    const itemCluster = getClusterForItem(itemId);
    setCluster(itemCluster);
  }, [itemId, getClusterForItem]);

  return cluster;
}

/**
 * Hook to find shortest path between two items
 */
export function useConnectionPath(
  sourceId: string | undefined,
  targetId: string | undefined,
  maxDepth: number = 3
) {
  const findPath = useConnectionStore(state => state.findPath);
  const [path, setPath] = useState<any>(null);

  useEffect(() => {
    if (!sourceId || !targetId) {
      setPath(null);
      return;
    }

    const result = findPath(sourceId, targetId, maxDepth);
    setPath(result);
  }, [sourceId, targetId, maxDepth, findPath]);

  return path;
}

/**
 * Hook for auto-discovering connections when new thoughts/memories are added
 */
export function useAutoDiscovery(
  thoughts: Thought[],
  memories: Memory[],
  enabled: boolean = true
) {
  const { discoverForItems } = useConnectionDiscovery();
  const [lastProcessedCount, setLastProcessedCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const totalItems = thoughts.length + memories.length;
    if (totalItems === lastProcessedCount) return;

    // Get new items
    const newThoughts = thoughts.slice(lastProcessedCount);
    const newMemories = memories.slice(lastProcessedCount - thoughts.length);

    if (newThoughts.length === 0 && newMemories.length === 0) return;

    // Convert to connection items
    const newItems = [
      ...newThoughts.map(t => ({
        id: t.id,
        content: t.content,
        timestamp: t.createdAt,
        tags: t.metadata.tags,
        type: 'thought' as const
      })),
      ...newMemories.map(m => ({
        id: m.id,
        content: m.content,
        timestamp: m.createdAt,
        tags: m.tags,
        type: 'memory' as const
      }))
    ];

    const existingItems = [
      ...thoughts.slice(0, lastProcessedCount).map(t => ({
        id: t.id,
        content: t.content,
        timestamp: t.createdAt,
        tags: t.metadata.tags,
        type: 'thought' as const
      })),
      ...memories.slice(0, Math.max(0, lastProcessedCount - thoughts.length)).map(m => ({
        id: m.id,
        content: m.content,
        timestamp: m.createdAt,
        tags: m.tags,
        type: 'memory' as const
      }))
    ];

    // Discover connections
    discoverForItems(newItems, existingItems);
    setLastProcessedCount(totalItems);
  }, [thoughts, memories, enabled, lastProcessedCount, discoverForItems]);
}
