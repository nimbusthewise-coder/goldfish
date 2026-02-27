/**
 * Types for the Living Constellation View
 */

import type { Thought as BaseThought } from './thought';

// Re-export the base Thought type for use in constellation
export type Thought = BaseThought;

export interface ConstellationNode {
  id: string;
  thought: Thought;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  fx?: number; // fixed position x
  fy?: number; // fixed position y
  radius: number;
  mass: number;
  color: string;
  glowIntensity: number;
}

export interface Connection {
  id: string;
  source: string; // node id
  target: string; // node id
  strength: number; // 0-1
  type: ConnectionType;
  distance: number;
  glowIntensity: number;
}

export enum ConnectionType {
  KEYWORD = 'keyword',
  TEMPORAL = 'temporal',
  WONDER = 'wonder',
  SEMANTIC = 'semantic'
}

export interface LayoutConfig {
  width: number;
  height: number;
  nodeRadius: number;
  repulsionStrength: number;
  attractionStrength: number;
  centerStrength: number;
  damping: number;
  minDistance: number;
  maxDistance: number;
}

export interface InteractionState {
  hoveredNode: string | null;
  selectedNode: string | null;
  isPanning: boolean;
  isZooming: boolean;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}

export interface AnimationFrame {
  timestamp: number;
  alpha: number; // simulation temperature
  nodes: ConstellationNode[];
  connections: Connection[];
}
