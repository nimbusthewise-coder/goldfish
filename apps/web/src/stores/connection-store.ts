/**
 * Connection Store
 * Manages connection state and discovery
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Connection,
  ConnectionType,
  ConnectionGraph,
  ConnectionCluster,
  ConnectionPath,
  ConnectionSearchQuery,
  ConnectionAnalysis,
  ConnectionStats,
  ConnectionStoreState,
  ConnectionDiscoveryConfig
} from '@/types/connections';
import { getConnectionService } from '@/services/connection-service';

const connectionService = getConnectionService();

export const useConnectionStore = create<ConnectionStoreState>()(
  persist(
    (set, get) => ({
      connections: new Map(),
      graph: {
        nodes: new Set(),
        edges: new Map(),
        nodeMetadata: new Map()
      },
      clusters: [],
      config: {
        minSemanticSimilarity: 0.3,
        maxTemporalDelta: 7 * 24 * 60 * 60 * 1000,
        minSharedTags: 2,
        batchSize: 50,
        enableBackgroundDiscovery: true,
        discoveryInterval: 60000
      },
      isDiscovering: false,
      lastDiscoveryAt: undefined,
      processingQueue: [],

      addConnection: (connectionData) => {
        const connection: Connection = {
          ...connectionData,
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          discoveredAt: Date.now(),
          viewCount: 0
        };

        set((state) => {
          const newConnections = new Map(state.connections);
          newConnections.set(connection.id, connection);

          // Update graph
          const newGraph = { ...state.graph };
          if (!newGraph.edges.has(connection.sourceId)) {
            newGraph.edges.set(connection.sourceId, []);
          }
          newGraph.edges.get(connection.sourceId)!.push(connection);

          return {
            connections: newConnections,
            graph: newGraph
          };
        });

        return connection;
      },

      getConnection: (id) => {
        return get().connections.get(id);
      },

      getConnectionsForItem: (itemId, options) => {
        const edges = get().graph.edges.get(itemId) || [];
        let filtered = edges;

        if (options?.types) {
          filtered = filtered.filter(conn => options.types!.includes(conn.type));
        }

        if (options?.minWeight !== undefined) {
          filtered = filtered.filter(conn => conn.weight >= options.minWeight!);
        }

        return filtered;
      },

      findPath: (sourceId, targetId, maxDepth = 3) => {
        return connectionService.findPath(sourceId, targetId, maxDepth);
      },

      searchConnections: (query) => {
        const { itemId, maxDepth = 2, minWeight = 0, types, limit = 50 } = query;
        let results: Connection[] = [];

        // BFS to find connections up to maxDepth
        const visited = new Set<string>([itemId]);
        const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: itemId, depth: 0 }];
        const graph = get().graph;

        while (queue.length > 0) {
          const { nodeId, depth } = queue.shift()!;

          if (depth >= maxDepth) continue;

          const edges = graph.edges.get(nodeId) || [];
          for (const edge of edges) {
            if (edge.weight >= minWeight && (!types || types.includes(edge.type))) {
              results.push(edge);
            }

            if (!visited.has(edge.targetId)) {
              visited.add(edge.targetId);
              queue.push({ nodeId: edge.targetId, depth: depth + 1 });
            }
          }
        }

        // Sort by weight and limit
        return results
          .sort((a, b) => b.weight - a.weight)
          .slice(0, limit);
      },

      confirmConnection: (connectionId) => {
        set((state) => {
          const newConnections = new Map(state.connections);
          const connection = newConnections.get(connectionId);
          if (connection) {
            connection.confirmed = true;
            connection.dismissed = false;
          }
          return { connections: newConnections };
        });
      },

      dismissConnection: (connectionId) => {
        set((state) => {
          const newConnections = new Map(state.connections);
          const connection = newConnections.get(connectionId);
          if (connection) {
            connection.dismissed = true;
            connection.confirmed = false;
          }
          return { connections: newConnections };
        });
      },

      analyzeItem: (itemId) => {
        return connectionService.analyzeItem(itemId);
      },

      getClusters: () => {
        return get().clusters;
      },

      getClusterForItem: (itemId) => {
        return get().clusters.find(cluster => cluster.itemIds.includes(itemId));
      },

      getStats: () => {
        const state = get();
        const connections = Array.from(state.connections.values());
        const nonDismissed = connections.filter(c => !c.dismissed);

        const connectionsByType: Record<ConnectionType, number> = {
          semantic: 0,
          temporal: 0,
          contextual: 0,
          categorical: 0
        };

        nonDismissed.forEach(conn => {
          connectionsByType[conn.type]++;
        });

        const totalWeight = nonDismissed.reduce((sum, conn) => sum + conn.weight, 0);
        const averageWeight = nonDismissed.length > 0 ? totalWeight / nonDismissed.length : 0;

        const totalNodes = state.graph.nodes.size;
        const totalEdges = nonDismissed.length;
        const maxPossibleEdges = totalNodes * (totalNodes - 1);
        const graphDensity = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

        // Count isolated nodes
        const connectedNodes = new Set<string>();
        nonDismissed.forEach(conn => {
          connectedNodes.add(conn.sourceId);
          connectedNodes.add(conn.targetId);
        });
        const isolatedNodes = totalNodes - connectedNodes.size;

        // Find largest connected component
        const largestComponent = findLargestComponent(state.graph, nonDismissed);

        const stats: ConnectionStats = {
          totalConnections: nonDismissed.length,
          connectionsByType,
          averageWeight,
          confirmedConnections: connections.filter(c => c.confirmed).length,
          dismissedConnections: connections.filter(c => c.dismissed).length,
          totalClusters: state.clusters.length,
          averageClusterSize: state.clusters.length > 0
            ? state.clusters.reduce((sum, c) => sum + c.itemIds.length, 0) / state.clusters.length
            : 0,
          graphDensity,
          isolatedNodes,
          largestComponentSize: largestComponent
        };

        return stats;
      },

      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig }
        }));
        connectionService.updateConfig(newConfig);
      },

      discoverConnections: async () => {
        const state = get();
        if (state.isDiscovering) return;

        set({ isDiscovering: true });

        try {
          // This would be called with actual data from thought/memory stores
          // For now, we just update the timestamp
          set({
            lastDiscoveryAt: Date.now(),
            isDiscovering: false
          });
        } catch (error) {
          console.error('Connection discovery failed:', error);
          set({ isDiscovering: false });
        }
      },

      clearAll: () => {
        connectionService.clearAll();
        set({
          connections: new Map(),
          graph: {
            nodes: new Set(),
            edges: new Map(),
            nodeMetadata: new Map()
          },
          clusters: [],
          processingQueue: []
        });
      },

      exportConnections: () => {
        const state = get();
        const data = {
          connections: Array.from(state.connections.entries()),
          clusters: state.clusters,
          config: state.config,
          exportedAt: Date.now()
        };
        return JSON.stringify(data);
      },

      importConnections: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          const connectionsArray = data.connections as Array<[string, Connection]>;
          const connections = new Map<string, Connection>(connectionsArray);

          // Rebuild graph from connections
          const graph: ConnectionGraph = {
            nodes: new Set(),
            edges: new Map(),
            nodeMetadata: new Map()
          };

          connections.forEach((conn: Connection) => {
            graph.nodes.add(conn.sourceId);
            graph.nodes.add(conn.targetId);

            if (!graph.edges.has(conn.sourceId)) {
              graph.edges.set(conn.sourceId, []);
            }
            graph.edges.get(conn.sourceId)!.push(conn);
          });

          set({
            connections,
            graph,
            clusters: data.clusters || [],
            config: data.config || get().config
          });
        } catch (error) {
          console.error('Failed to import connections:', error);
          throw new Error('Invalid connection data');
        }
      }
    }),
    {
      name: 'goldfish-connections',
      partialize: (state) => ({
        connections: Array.from(state.connections.entries()),
        clusters: state.clusters,
        config: state.config
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).connections)) {
          // Convert array back to Map after hydration
          const connectionsArray = (state as any).connections as Array<[string, Connection]>;
          (state as any).connections = new Map<string, Connection>(connectionsArray);

          // Rebuild graph
          const graph: ConnectionGraph = {
            nodes: new Set(),
            edges: new Map(),
            nodeMetadata: new Map()
          };

          const connectionsMap = (state as any).connections as Map<string, Connection>;
          connectionsMap.forEach((conn: Connection) => {
            graph.nodes.add(conn.sourceId);
            graph.nodes.add(conn.targetId);

            if (!graph.edges.has(conn.sourceId)) {
              graph.edges.set(conn.sourceId, []);
            }
            graph.edges.get(conn.sourceId)!.push(conn);
          });

          (state as any).graph = graph;
        }
      }
    }
  )
);

/**
 * Find largest connected component using DFS
 */
function findLargestComponent(graph: ConnectionGraph, connections: Connection[]): number {
  const visited = new Set<string>();
  let largestSize = 0;

  const dfs = (nodeId: string): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    let size = 1;
    const edges = graph.edges.get(nodeId) || [];

    for (const edge of edges) {
      if (connections.includes(edge)) {
        size += dfs(edge.targetId);
      }
    }

    return size;
  };

  for (const nodeId of graph.nodes) {
    if (!visited.has(nodeId)) {
      const componentSize = dfs(nodeId);
      largestSize = Math.max(largestSize, componentSize);
    }
  }

  return largestSize;
}
