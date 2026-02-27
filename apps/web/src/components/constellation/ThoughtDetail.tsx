/**
 * Thought Detail Panel Component
 * Shows detailed information about a selected thought
 */

'use client';

import { Thought } from '@/types/constellation';

interface ThoughtDetailProps {
  thought: Thought;
  onClose: () => void;
  onZoom: () => void;
}

export function ThoughtDetail({ thought, onClose, onZoom }: ThoughtDetailProps) {
  return (
    <div className="thought-detail-overlay" onClick={onClose}>
      <div
        className="thought-detail-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="detail-header">
          <h2 className="detail-title">Thought Details</h2>
          <button onClick={onClose} className="detail-close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="detail-content">
          <div className="detail-section">
            <h3 className="section-title">Content</h3>
            <p className="thought-content">{thought.content}</p>
          </div>

          {/* Metadata */}
          <div className="detail-section">
            <h3 className="section-title">Metadata</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {thought.timestamp
                    ? thought.timestamp.toLocaleString()
                    : new Date(thought.metadata.timestamp).toLocaleString()}
                </span>
              </div>

              {thought.wonderScore !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">Wonder Score:</span>
                  <span className="metadata-value">
                    {(thought.wonderScore * 100).toFixed(0)}%
                  </span>
                  <div className="wonder-bar">
                    <div
                      className="wonder-fill"
                      style={{ width: `${thought.wonderScore * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {thought.metadata?.confidence !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">Confidence:</span>
                  <span className="metadata-value">
                    {(thought.metadata.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {thought.metadata?.category && (
                <div className="metadata-item">
                  <span className="metadata-label">Category:</span>
                  <span className="metadata-value metadata-category">
                    {thought.metadata.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Keywords */}
          {thought.keywords && thought.keywords.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">Keywords</h3>
              <div className="keywords-list">
                {thought.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          {thought.metadata?.connections &&
            thought.metadata.connections.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">Connections</h3>
                <p className="connections-count">
                  Connected to {thought.metadata.connections.length} other
                  thought(s)
                </p>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="detail-actions">
          <button onClick={onZoom} className="action-button action-primary">
            🔍 Zoom to Thought
          </button>
          <button onClick={onClose} className="action-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
