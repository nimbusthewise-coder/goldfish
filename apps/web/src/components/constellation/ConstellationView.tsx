/**
 * Main Constellation View Component
 * Orchestrates the entire constellation visualization
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ConstellationCanvas } from './ConstellationCanvas';
import { ConstellationControls } from './ConstellationControls';
import { ThoughtDetail } from './ThoughtDetail';
import { useConstellationLayout } from '@/hooks/useConstellationLayout';
import { useConstellationInteraction } from '@/hooks/useConstellationInteraction';
import { Thought, ConstellationNode } from '@/types/constellation';

interface ConstellationViewProps {
  thoughts: Thought[];
  onThoughtSelect?: (thought: Thought) => void;
  className?: string;
}

export function ConstellationView({
  thoughts,
  onThoughtSelect,
  className = ''
}: ConstellationViewProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Layout management
  const {
    nodes,
    connections,
    isRunning,
    alpha,
    start,
    stop,
    restart,
    fixNode,
    unfixNode
  } = useConstellationLayout({
    thoughts,
    config: {
      width: dimensions.width,
      height: dimensions.height
    },
    autoStart: true
  });

  // Interaction management
  const handleNodeClick = useCallback(
    (node: ConstellationNode) => {
      setSelectedThought(node.thought);
      setIsDetailOpen(true);
      onThoughtSelect?.(node.thought);
    },
    [onThoughtSelect]
  );

  const handleNodeHover = useCallback((node: ConstellationNode | null) => {
    // Could show tooltip or preview here
  }, []);

  const { interactionState, handlers, resetView, zoomToNode } =
    useConstellationInteraction({
      nodes,
      onNodeClick: handleNodeClick,
      onNodeHover: handleNodeHover
    });

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle detail close
  const handleDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedThought(null);
  }, []);

  // Handle zoom to selected thought
  const handleZoomToThought = useCallback(() => {
    if (selectedThought) {
      zoomToNode(selectedThought.id, 2);
    }
  }, [selectedThought, zoomToNode]);

  return (
    <div className={`constellation-view ${className}`}>
      {/* Canvas */}
      <div className="constellation-canvas-container">
        <ConstellationCanvas
          nodes={nodes}
          connections={connections}
          interactionState={interactionState}
          width={dimensions.width}
          height={dimensions.height}
          className="constellation-canvas"
          {...handlers}
        />
      </div>

      {/* Controls */}
      <ConstellationControls
        isRunning={isRunning}
        alpha={alpha}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        zoomLevel={interactionState.zoomLevel}
        onStart={start}
        onStop={stop}
        onRestart={restart}
        onResetView={resetView}
      />

      {/* Thought Detail Panel */}
      {isDetailOpen && selectedThought && (
        <ThoughtDetail
          thought={selectedThought}
          onClose={handleDetailClose}
          onZoom={handleZoomToThought}
        />
      )}

      {/* Loading indicator */}
      {thoughts.length === 0 && (
        <div className="constellation-empty">
          <p>No thoughts to display</p>
          <p className="text-sm opacity-60">
            Start capturing your thoughts to see them in the constellation
          </p>
        </div>
      )}
    </div>
  );
}
