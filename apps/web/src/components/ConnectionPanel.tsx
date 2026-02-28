/**
 * Connection Panel Component
 * Displays connections for a selected item in a side panel
 */

'use client';

import React, { useState } from 'react';
import type { Connection, ConnectionType } from '@/types/connections';
import { useItemConnections, useConnectionActions, useItemCluster } from '@/hooks/useConnections';

interface ConnectionPanelProps {
  itemId: string | undefined;
  onConnectionClick?: (connectionId: string, targetId: string) => void;
  className?: string;
}

const CONNECTION_TYPE_COLORS: Record<ConnectionType, string> = {
  semantic: 'bg-blue-100 text-blue-800',
  temporal: 'bg-green-100 text-green-800',
  contextual: 'bg-purple-100 text-purple-800',
  categorical: 'bg-orange-100 text-orange-800'
};

const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  semantic: 'Similar Content',
  temporal: 'Time-Based',
  contextual: 'Shared Context',
  categorical: 'Same Theme'
};

export default function ConnectionPanel({ itemId, onConnectionClick, className = '' }: ConnectionPanelProps) {
  const connections = useItemConnections(itemId);
  const { confirm, dismiss } = useConnectionActions();
  const cluster = useItemCluster(itemId);
  const [filterType, setFilterType] = useState<ConnectionType | 'all'>('all');
  const [minWeight, setMinWeight] = useState(0.3);

  if (!itemId) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>Select an item to view connections</p>
      </div>
    );
  }

  const filteredConnections = connections.filter(conn => {
    if (conn.dismissed) return false;
    if (filterType !== 'all' && conn.type !== filterType) return false;
    if (conn.weight < minWeight) return false;
    return true;
  });

  const groupedByType = filteredConnections.reduce((acc, conn) => {
    if (!acc[conn.type]) acc[conn.type] = [];
    acc[conn.type].push(conn);
    return acc;
  }, {} as Record<ConnectionType, Connection[]>);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Connections</h2>
        <p className="text-sm text-gray-600 mt-1">
          {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ConnectionType | 'all')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="semantic">Similar Content</option>
            <option value="temporal">Time-Based</option>
            <option value="contextual">Shared Context</option>
            <option value="categorical">Same Theme</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Min Strength: {Math.round(minWeight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minWeight}
            onChange={(e) => setMinWeight(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Cluster Info */}
      {cluster && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Part of a cluster</p>
              <p className="text-xs text-blue-700 mt-1">
                Theme: {cluster.theme}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                {cluster.itemIds.length} related items
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConnections.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No connections found</p>
            <p className="text-xs mt-1">Try adjusting the filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedByType).map(([type, conns]) => (
              <div key={type} className="p-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {CONNECTION_TYPE_LABELS[type as ConnectionType]} ({conns.length})
                </h3>
                <div className="space-y-3">
                  {conns.map((conn) => (
                    <ConnectionCard
                      key={conn.id}
                      connection={conn}
                      onConfirm={() => confirm(conn.id)}
                      onDismiss={() => dismiss(conn.id)}
                      onClick={() => onConnectionClick?.(conn.id, conn.targetId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConnectionCardProps {
  connection: Connection;
  onConfirm: () => void;
  onDismiss: () => void;
  onClick: () => void;
}

function ConnectionCard({ connection, onConfirm, onDismiss, onClick }: ConnectionCardProps) {
  const strengthPercent = Math.round(connection.weight * 100);
  const confidencePercent = Math.round(connection.confidence * 100);

  return (
    <div
      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${CONNECTION_TYPE_COLORS[connection.type]}`}>
          {CONNECTION_TYPE_LABELS[connection.type]}
        </span>
        <div className="flex items-center space-x-1">
          <div className="text-xs text-gray-600">
            {strengthPercent}%
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2">{connection.reason}</p>

      {connection.sharedThemes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {connection.sharedThemes.slice(0, 5).map((theme, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
            title="Confirm this connection"
          >
            {connection.confirmed ? '✓ Confirmed' : 'Confirm'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Dismiss this connection"
          >
            Dismiss
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {confidencePercent}% confident
        </div>
      </div>
    </div>
  );
}
