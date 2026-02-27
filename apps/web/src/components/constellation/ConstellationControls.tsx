/**
 * Constellation Controls Component
 * UI controls for the constellation view
 */

'use client';

interface ConstellationControlsProps {
  isRunning: boolean;
  alpha: number;
  nodeCount: number;
  connectionCount: number;
  zoomLevel: number;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onResetView: () => void;
}

export function ConstellationControls({
  isRunning,
  alpha,
  nodeCount,
  connectionCount,
  zoomLevel,
  onStart,
  onStop,
  onRestart,
  onResetView
}: ConstellationControlsProps) {
  return (
    <div className="constellation-controls">
      {/* Simulation Controls */}
      <div className="controls-section">
        <h3 className="controls-title">Simulation</h3>
        <div className="controls-buttons">
          {isRunning ? (
            <button onClick={onStop} className="control-button">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={onStart} className="control-button">
              ▶ Start
            </button>
          )}
          <button onClick={onRestart} className="control-button">
            🔄 Restart
          </button>
        </div>
        <div className="controls-info">
          <span className="info-label">Energy:</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${alpha * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="controls-section">
        <h3 className="controls-title">View</h3>
        <div className="controls-buttons">
          <button onClick={onResetView} className="control-button">
            🎯 Reset View
          </button>
        </div>
        <div className="controls-info">
          <span className="info-label">Zoom:</span>
          <span className="info-value">{(zoomLevel * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="controls-section">
        <h3 className="controls-title">Stats</h3>
        <div className="controls-stats">
          <div className="stat-item">
            <span className="stat-label">Thoughts:</span>
            <span className="stat-value">{nodeCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Connections:</span>
            <span className="stat-value">{connectionCount}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="controls-section controls-help">
        <h3 className="controls-title">Controls</h3>
        <ul className="help-list">
          <li>🖱️ Click & drag to pan</li>
          <li>🔍 Scroll to zoom</li>
          <li>👆 Click node for details</li>
          <li>📱 Pinch to zoom (mobile)</li>
        </ul>
      </div>
    </div>
  );
}
