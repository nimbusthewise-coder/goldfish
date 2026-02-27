/**
 * Canvas rendering component for constellation visualization
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ConstellationNode, Connection, InteractionState } from '@/types/constellation';
import { glowAnimator, particleSystem } from '@/lib/constellation/animation-engine';

interface ConstellationCanvasProps {
  nodes: ConstellationNode[];
  connections: Connection[];
  interactionState: InteractionState;
  width: number;
  height: number;
  className?: string;
}

export function ConstellationCanvas({
  nodes,
  connections,
  interactionState,
  width,
  height,
  className = ''
}: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  /**
   * Draw a single connection
   */
  const drawConnection = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      conn: Connection,
      nodeMap: Map<string, ConstellationNode>
    ) => {
      const source = nodeMap.get(conn.source);
      const target = nodeMap.get(conn.target);

      if (!source || !target) return;

      const { x: sx, y: sy } = transformPoint(
        source.x,
        source.y,
        interactionState
      );
      const { x: tx, y: ty } = transformPoint(
        target.x,
        target.y,
        interactionState
      );

      // Animated glow
      const glowIntensity = glowAnimator.getConnectionGlow(
        conn.glowIntensity,
        conn.strength
      );

      // Gradient for glow effect
      const gradient = ctx.createLinearGradient(sx, sy, tx, ty);
      const alpha = conn.strength * glowIntensity;
      
      gradient.addColorStop(0, `rgba(135, 206, 235, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha})`);
      gradient.addColorStop(1, `rgba(135, 206, 235, ${alpha * 0.8})`);

      // Draw connection line
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(1, conn.strength * 3 * interactionState.zoomLevel);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Draw glow
      if (glowIntensity > 0.5) {
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
        ctx.lineWidth = Math.max(3, conn.strength * 6 * interactionState.zoomLevel);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    },
    [interactionState]
  );

  /**
   * Draw a single node
   */
  const drawNode = useCallback(
    (ctx: CanvasRenderingContext2D, node: ConstellationNode) => {
      const { x, y } = transformPoint(node.x, node.y, interactionState);
      const radius = node.radius * interactionState.zoomLevel;

      const isHovered = node.id === interactionState.hoveredNode;
      const isSelected = node.id === interactionState.selectedNode;

      // Animated glow
      const glowIntensity = glowAnimator.getNodeGlow(node.glowIntensity);

      // Draw glow effect
      if (glowIntensity > 0 || isHovered) {
        const glowRadius = radius * (isHovered ? 2.5 : 2);
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
        
        const baseAlpha = isHovered ? 0.4 : glowIntensity * 0.3;
        gradient.addColorStop(0, `${node.color}${Math.floor(baseAlpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw node body
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw inner highlight
      const highlightGradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    [interactionState]
  );

  /**
   * Draw particles
   */
  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const particles = particleSystem.getParticles();

      particles.forEach(particle => {
        const { x, y } = transformPoint(
          particle.x,
          particle.y,
          interactionState
        );

        ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          particle.size * interactionState.zoomLevel,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    },
    [interactionState]
  );

  /**
   * Main render function
   */
  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate delta time
      const delta = lastTimeRef.current ? timestamp - lastTimeRef.current : 0;
      lastTimeRef.current = timestamp;

      // Update animations
      glowAnimator.update(delta * 0.001);
      particleSystem.update(delta);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Create node map for quick lookup
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // Draw connections first (behind nodes)
      connections.forEach(conn => drawConnection(ctx, conn, nodeMap));

      // Draw nodes
      nodes.forEach(node => drawNode(ctx, node));

      // Draw particles
      drawParticles(ctx);

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(render);
    },
    [nodes, connections, width, height, drawConnection, drawNode, drawParticles]
  );

  /**
   * Start rendering loop
   */
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  /**
   * Handle canvas resize
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        display: 'block',
        touchAction: 'none'
      }}
    />
  );
}

/**
 * Transform point based on pan and zoom
 */
function transformPoint(
  x: number,
  y: number,
  state: InteractionState
): { x: number; y: number } {
  return {
    x: x * state.zoomLevel + state.panOffset.x,
    y: y * state.zoomLevel + state.panOffset.y
  };
}
