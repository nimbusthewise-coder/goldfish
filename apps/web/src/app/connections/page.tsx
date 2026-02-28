/**
 * Connections Page
 * Dedicated view for exploring discovered connections
 */

'use client';

import React, { useState, useEffect } from 'react';
import ConnectionGraph from '@/components/ConnectionGraph';
import ConnectionPanel from '@/components/ConnectionPanel';
import { useConnectionStore } from '@/stores/connection-store';
import { useConnectionStats, useClusters } from '@/hooks/useConnections';
import type { NodeMetadata } from '@/types/connections';

export default function ConnectionsPage() {
  const graph = useConnectionStore(state => state.graph);
  const getAllConnections = useConnectionStore(state => state.connections);
  const stats = useConnectionStats();
  const clusters = useClusters();
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'clusters'>('graph');

  const connections = Array.from(getAllConnections.values()).filter(c => !c.dismissed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connection Discovery</h1>
              <p className="mt-1 text-sm text-gray-600">
                Explore relationships and patterns in your thoughts and memories
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Graph View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('clusters')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'clusters'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clusters
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="Total Connections"
                value={stats.totalConnections}
                icon="🔗"
              />
              <StatCard
                label="Confirmed"
                value={stats.confirmedConnections}
                icon="✓"
              />
              <StatCard
                label="Clusters"
                value={stats.totalClusters}
                icon="📦"
              />
              <StatCard
                label="Avg Strength"
                value={`${Math.round(stats.averageWeight * 100)}%`}
                icon="💪"
              />
              <StatCard
                label="Graph Density"
                value={`${Math.round(stats.graphDensity * 100)}%`}
                icon="🌐"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Graph</h2>
                {graph.nodes.size > 0 ? (
                  <ConnectionGraph
                    nodes={graph.nodeMetadata}
                    connections={connections}
                    selectedNodeId={selectedNodeId}
                    onNodeClick={setSelectedNodeId}
                    width={800}
                    height={600}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-lg font-medium">No connections yet</p>
                      <p className="text-sm mt-1">Add more thoughts and memories to discover connections</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
                <ConnectionPanel
                  itemId={selectedNodeId}
                  onConnectionClick={(_, targetId) => setSelectedNodeId(targetId)}
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Connections</h2>
            {connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedNodeId(conn.sourceId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {conn.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(conn.weight * 100)}% strength
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{conn.reason}</p>
                        {conn.sharedThemes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conn.sharedThemes.slice(0, 5).map((theme, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {conn.confirmed && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No connections found</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'clusters' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discovered Clusters</h2>
            {clusters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {cluster.theme}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {cluster.itemIds.length} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cluster.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Cohesion: {Math.round(cluster.cohesion * 100)}%</span>
                      <span>Confidence: {Math.round(cluster.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No clusters detected yet</p>
                <p className="text-sm mt-1">Clusters will appear as connections grow</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
