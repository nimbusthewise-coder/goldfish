/**
 * Connection Graph Component
 * Visual graph display of connections between items
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Connection, ConnectionType, NodeMetadata } from '@/types/connections';

interface ConnectionGraphProps {
  nodes: Map<string, NodeMetadata>;
  connections: Connection[];
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  metadata: NodeMetadata;
}

const CONNECTION_TYPE_COLORS: Record<ConnectionType, string> = {
  semantic: '#3b82f6',
  temporal: '#10b981',
  contextual: '#8b5cf6',
  categorical: '#f97316'
};

export default function ConnectionGraph({
  nodes,
  connections,
  selectedNodeId,
  onNodeClick,
  width = 800,
  height = 600,
  className = ''
}: ConnectionGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphNodes, setGraphNodes] = useState<Map<string, GraphNode>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize graph nodes
  useEffect(() => {
    const newGraphNodes = new Map<string, GraphNode>();
    let index = 0;

    nodes.forEach((metadata, nodeId) => {
      // Position nodes in a circle initially
      const angle = (index / nodes.size) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const centerX = width / 2;
      const centerY = height / 2;

      newGraphNodes.set(nodeId, {
        id: nodeId,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        metadata
      });

      index++;
    });

    setGraphNodes(newGraphNodes);
  }, [nodes, width, height]);

  // Physics simulation
  useEffect(() => {
    if (graphNodes.size === 0) return;

    const simulate = () => {
      const newNodes = new Map<string, GraphNode>(graphNodes);
      const damping = 0.9;
      const repulsion = 5000;
      const attraction = 0.01;
      const idealLength = 150;

      // Apply forces
      newNodes.forEach((node) => {
        let fx = 0;
        let fy = 0;

        // Repulsion from all other nodes
        newNodes.forEach((other) => {
          if (node.id === other.id) return;

          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > 0) {
            const force = repulsion / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Attraction along edges
        connections.forEach((conn) => {
          if (conn.sourceId === node.id || conn.targetId === node.id) {
            const otherId = conn.sourceId === node.id ? conn.targetId : conn.sourceId;
            const other = newNodes.get(otherId);

            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist > 0) {
                const force = attraction * (dist - idealLength) * conn.weight;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
              }
            }
          }
        });

        // Center gravity
        const centerX = width / 2;
        const centerY = height / 2;
        const toCenterX = centerX - node.x;
        const toCenterY = centerY - node.y;
        fx += toCenterX * 0.01;
        fy += toCenterY * 0.01;

        // Update velocity and position
        if (!isDragging || draggedNode !== node.id) {
          node.vx = (node.vx + fx) * damping;
          node.vy = (node.vy + fy) * damping;
          node.x += node.vx;
          node.y += node.vy;

          // Keep within bounds
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        }
      });

      setGraphNodes(newNodes);
      render(newNodes);

      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    animationFrameRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [graphNodes, connections, width, height, isDragging, draggedNode]);

  // Render graph
  const render = (nodes: Map<string, GraphNode>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    connections.forEach((conn) => {
      const source = nodes.get(conn.sourceId);
      const target = nodes.get(conn.targetId);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = CONNECTION_TYPE_COLORS[conn.type];
        ctx.lineWidth = 1 + conn.weight * 2;
        ctx.globalAlpha = 0.3 + conn.weight * 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const radius = isSelected ? 12 : 8;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#3b82f6' : '#6b7280';
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? '#1d4ed8' : '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (isSelected) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        const preview = node.metadata.contentPreview.substring(0, 30) + '...';
        ctx.fillText(preview, node.x, node.y + radius + 15);
      }
    });
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    for (const [nodeId, node] of graphNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 12) {
        setIsDragging(true);
        setDraggedNode(nodeId);
        onNodeClick?.(nodeId);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setGraphNodes((prev) => {
      const newNodes = new Map(prev);
      const node = newNodes.get(draggedNode);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
      }
      return newNodes;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-gray-200 rounded-lg bg-white cursor-move"
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Connection Types</h4>
        <div className="space-y-1">
          {Object.entries(CONNECTION_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
        <div className="text-xs text-gray-600">
          <div>{nodes.size} nodes</div>
          <div>{connections.length} connections</div>
        </div>
      </div>
    </div>
  );
}
