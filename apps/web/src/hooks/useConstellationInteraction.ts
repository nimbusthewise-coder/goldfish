/**
 * Hook for managing constellation interactions
 */

import { useState, useCallback, useRef, MouseEvent, TouchEvent, WheelEvent } from 'react';
import { ConstellationNode, InteractionState } from '@/types/constellation';

interface UseConstellationInteractionOptions {
  nodes: ConstellationNode[];
  onNodeClick?: (node: ConstellationNode) => void;
  onNodeHover?: (node: ConstellationNode | null) => void;
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
}

export function useConstellationInteraction({
  nodes,
  onNodeClick,
  onNodeHover,
  minZoom = 0.5,
  maxZoom = 3,
  zoomSpeed = 0.001
}: UseConstellationInteractionOptions) {
  const [interactionState, setInteractionState] = useState<InteractionState>({
    hoveredNode: null,
    selectedNode: null,
    isPanning: false,
    isZooming: false,
    panOffset: { x: 0, y: 0 },
    zoomLevel: 1
  });

  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Find node at position
   */
  const findNodeAtPosition = useCallback(
    (x: number, y: number): ConstellationNode | null => {
      // Account for zoom and pan
      const adjustedX = (x - interactionState.panOffset.x) / interactionState.zoomLevel;
      const adjustedY = (y - interactionState.panOffset.y) / interactionState.zoomLevel;

      for (const node of nodes) {
        const dx = node.x - adjustedX;
        const dy = node.y - adjustedY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= node.radius) {
          return node;
        }
      }

      return null;
    },
    [nodes, interactionState.panOffset, interactionState.zoomLevel]
  );

  /**
   * Handle mouse down
   */
  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const node = findNodeAtPosition(x, y);

      if (node) {
        setInteractionState(prev => ({
          ...prev,
          selectedNode: node.id
        }));
      } else {
        // Start panning
        panStartRef.current = { x: event.clientX, y: event.clientY };
        lastPanRef.current = interactionState.panOffset;
        setInteractionState(prev => ({
          ...prev,
          isPanning: true,
          selectedNode: null
        }));
      }
    },
    [findNodeAtPosition, interactionState.panOffset]
  );

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Handle panning
      if (interactionState.isPanning && panStartRef.current) {
        const dx = event.clientX - panStartRef.current.x;
        const dy = event.clientY - panStartRef.current.y;

        setInteractionState(prev => ({
          ...prev,
          panOffset: {
            x: lastPanRef.current.x + dx,
            y: lastPanRef.current.y + dy
          }
        }));
        return;
      }

      // Handle hover
      const node = findNodeAtPosition(x, y);
      const nodeId = node ? node.id : null;

      if (nodeId !== interactionState.hoveredNode) {
        setInteractionState(prev => ({
          ...prev,
          hoveredNode: nodeId
        }));
        onNodeHover?.(node);
      }
    },
    [findNodeAtPosition, interactionState.isPanning, interactionState.hoveredNode, onNodeHover]
  );

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!interactionState.isPanning && interactionState.selectedNode) {
        const node = nodes.find(n => n.id === interactionState.selectedNode);
        if (node) {
          onNodeClick?.(node);
        }
      }

      setInteractionState(prev => ({
        ...prev,
        isPanning: false
      }));
      panStartRef.current = null;
    },
    [nodes, interactionState.isPanning, interactionState.selectedNode, onNodeClick]
  );

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      hoveredNode: null,
      isPanning: false,
      selectedNode: null
    }));
    panStartRef.current = null;
    onNodeHover?.(null);
  }, [onNodeHover]);

  /**
   * Handle wheel (zoom)
   */
  const handleWheel = useCallback(
    (event: WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      const delta = -event.deltaY * zoomSpeed;
      const newZoom = Math.max(
        minZoom,
        Math.min(maxZoom, interactionState.zoomLevel + delta)
      );

      // Zoom toward mouse position
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const scale = newZoom / interactionState.zoomLevel;

      setInteractionState(prev => ({
        ...prev,
        zoomLevel: newZoom,
        panOffset: {
          x: mouseX - (mouseX - prev.panOffset.x) * scale,
          y: mouseY - (mouseY - prev.panOffset.y) * scale
        }
      }));
    },
    [interactionState.zoomLevel, minZoom, maxZoom, zoomSpeed]
  );

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLCanvasElement>) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = event.currentTarget.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const node = findNodeAtPosition(x, y);

        if (node) {
          setInteractionState(prev => ({
            ...prev,
            selectedNode: node.id
          }));
        } else {
          panStartRef.current = { x: touch.clientX, y: touch.clientY };
          lastPanRef.current = interactionState.panOffset;
          setInteractionState(prev => ({
            ...prev,
            isPanning: true,
            selectedNode: null
          }));
        }
      }
    },
    [findNodeAtPosition, interactionState.panOffset]
  );

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLCanvasElement>) => {
      if (event.touches.length === 1 && panStartRef.current) {
        const touch = event.touches[0];
        const dx = touch.clientX - panStartRef.current.x;
        const dy = touch.clientY - panStartRef.current.y;

        setInteractionState(prev => ({
          ...prev,
          panOffset: {
            x: lastPanRef.current.x + dx,
            y: lastPanRef.current.y + dy
          }
        }));
      }
    },
    []
  );

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    if (!interactionState.isPanning && interactionState.selectedNode) {
      const node = nodes.find(n => n.id === interactionState.selectedNode);
      if (node) {
        onNodeClick?.(node);
      }
    }

    setInteractionState(prev => ({
      ...prev,
      isPanning: false,
      selectedNode: null
    }));
    panStartRef.current = null;
  }, [nodes, interactionState.isPanning, interactionState.selectedNode, onNodeClick]);

  /**
   * Reset view
   */
  const resetView = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      panOffset: { x: 0, y: 0 },
      zoomLevel: 1
    }));
  }, []);

  /**
   * Zoom to node
   */
  const zoomToNode = useCallback(
    (nodeId: string, zoomLevel: number = 2) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || typeof window === 'undefined') return;

      // Center on node
      setInteractionState(prev => ({
        ...prev,
        zoomLevel,
        panOffset: {
          x: -node.x * zoomLevel + window.innerWidth / 2,
          y: -node.y * zoomLevel + window.innerHeight / 2
        },
        selectedNode: nodeId
      }));
    },
    [nodes]
  );

  return {
    interactionState,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    resetView,
    zoomToNode
  };
}
