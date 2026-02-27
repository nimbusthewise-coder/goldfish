/**
 * Hook for managing constellation layout
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ConstellationNode, Connection, Thought, LayoutConfig } from '@/types/constellation';
import { LayoutEngine } from '@/lib/constellation/layout-engine';
import { ConnectionDetector } from '@/lib/constellation/connection-detector';

interface UseConstellationLayoutOptions {
  thoughts: Thought[];
  config?: Partial<LayoutConfig>;
  autoStart?: boolean;
}

export function useConstellationLayout({
  thoughts,
  config = {},
  autoStart = true
}: UseConstellationLayoutOptions) {
  const [nodes, setNodes] = useState<ConstellationNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [alpha, setAlpha] = useState(1.0);

  const layoutEngineRef = useRef<LayoutEngine | undefined>(undefined);
  const connectionDetectorRef = useRef<ConnectionDetector | undefined>(undefined);
  const rafIdRef = useRef<number | null>(null);

  // Initialize engines
  useEffect(() => {
    layoutEngineRef.current = new LayoutEngine(config);
    connectionDetectorRef.current = new ConnectionDetector();
  }, []);

  // Update config when it changes
  useEffect(() => {
    if (layoutEngineRef.current && config) {
      layoutEngineRef.current.updateConfig(config);
    }
  }, [config]);

  // Initialize nodes and connections when thoughts change
  useEffect(() => {
    if (!layoutEngineRef.current || !connectionDetectorRef.current) return;

    const newNodes = layoutEngineRef.current.initializeNodes(thoughts);
    const newConnections = connectionDetectorRef.current.detectConnections(thoughts);

    setNodes(newNodes);
    setConnections(newConnections);

    if (autoStart) {
      start();
    }
  }, [thoughts, autoStart]);

  // Simulation tick
  const tick = useCallback(() => {
    if (!layoutEngineRef.current) return;

    const result = layoutEngineRef.current.tick(nodes, connections);
    setNodes(result.nodes);
    setAlpha(result.alpha);

    if (!layoutEngineRef.current.isStable()) {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      setIsRunning(false);
      rafIdRef.current = null;
    }
  }, [nodes, connections]);

  // Start simulation
  const start = useCallback(() => {
    if (!layoutEngineRef.current || isRunning) return;

    setIsRunning(true);
    layoutEngineRef.current.restart();
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick, isRunning]);

  // Stop simulation
  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Restart simulation
  const restart = useCallback(() => {
    stop();
    if (layoutEngineRef.current) {
      layoutEngineRef.current.restart(1.0);
      start();
    }
  }, [start, stop]);

  // Fix node position
  const fixNode = useCallback(
    (nodeId: string, x?: number, y?: number) => {
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === nodeId
            ? { ...node, fx: x, fy: y }
            : node
        )
      );
    },
    []
  );

  // Unfix node
  const unfixNode = useCallback((nodeId: string) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, fx: undefined, fy: undefined }
          : node
      )
    );
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    nodes,
    connections,
    isRunning,
    alpha,
    start,
    stop,
    restart,
    fixNode,
    unfixNode
  };
}
