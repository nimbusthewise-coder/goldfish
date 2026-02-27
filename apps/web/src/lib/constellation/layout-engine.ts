/**
 * Force-Directed Layout Engine
 * Implements physics-based node positioning algorithms
 */

import {
  ConstellationNode,
  Connection,
  LayoutConfig,
  Thought
} from '@/types/constellation';

const DEFAULT_CONFIG: LayoutConfig = {
  width: 800,
  height: 600,
  nodeRadius: 20,
  repulsionStrength: 500,
  attractionStrength: 0.01,
  centerStrength: 0.05,
  damping: 0.8,
  minDistance: 30,
  maxDistance: 300
};

export class LayoutEngine {
  private config: LayoutConfig;
  private alpha: number = 1.0; // simulation temperature
  private alphaMin: number = 0.001;
  private alphaDecay: number = 0.02;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize nodes from thoughts
   */
  initializeNodes(thoughts: Thought[]): ConstellationNode[] {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    return thoughts.map((thought, index) => {
      // Spread nodes in a circle initially
      const angle = (index / thoughts.length) * 2 * Math.PI;
      const radius = Math.min(this.config.width, this.config.height) / 3;

      return {
        id: thought.id,
        thought,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: this.calculateNodeRadius(thought),
        mass: this.calculateNodeMass(thought),
        color: this.calculateNodeColor(thought),
        glowIntensity: thought.wonderScore || 0
      };
    });
  }

  /**
   * Run one iteration of the force simulation
   */
  tick(nodes: ConstellationNode[], connections: Connection[]): {
    nodes: ConstellationNode[];
    alpha: number;
  } {
    if (this.alpha < this.alphaMin) {
      return { nodes, alpha: this.alpha };
    }

    // Apply forces
    this.applyRepulsionForce(nodes);
    this.applyAttractionForce(nodes, connections);
    this.applyCenterForce(nodes);
    this.applyCollisionForce(nodes);

    // Update positions
    const updatedNodes = nodes.map(node => {
      if (node.fx !== undefined && node.fy !== undefined) {
        // Node is fixed
        return { ...node, x: node.fx, y: node.fy, vx: 0, vy: 0 };
      }

      // Apply velocity with damping
      const vx = node.vx * this.config.damping;
      const vy = node.vy * this.config.damping;

      let x = node.x + vx;
      let y = node.y + vy;

      // Boundary constraints with soft bounce
      const padding = node.radius;
      if (x < padding) {
        x = padding;
        node.vx *= -0.5;
      }
      if (x > this.config.width - padding) {
        x = this.config.width - padding;
        node.vx *= -0.5;
      }
      if (y < padding) {
        y = padding;
        node.vy *= -0.5;
      }
      if (y > this.config.height - padding) {
        y = this.config.height - padding;
        node.vy *= -0.5;
      }

      return { ...node, x, y, vx, vy };
    });

    // Decay simulation temperature
    this.alpha -= this.alphaDecay;

    return { nodes: updatedNodes, alpha: this.alpha };
  }

  /**
   * Apply repulsion force between all nodes (like charges)
   */
  private applyRepulsionForce(nodes: ConstellationNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        const force = this.config.repulsionStrength / distSq * this.alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        nodeA.vx -= fx / nodeA.mass;
        nodeA.vy -= fy / nodeA.mass;
        nodeB.vx += fx / nodeB.mass;
        nodeB.vy += fy / nodeB.mass;
      }
    }
  }

  /**
   * Apply attraction force along connections (like springs)
   */
  private applyAttractionForce(
    nodes: ConstellationNode[],
    connections: Connection[]
  ): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const conn of connections) {
      const source = nodeMap.get(conn.source);
      const target = nodeMap.get(conn.target);

      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) continue;

      // Spring force toward ideal distance
      const displacement = dist - conn.distance;
      const force =
        displacement * this.config.attractionStrength * conn.strength * this.alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx / source.mass;
      source.vy += fy / source.mass;
      target.vx -= fx / target.mass;
      target.vy -= fy / target.mass;
    }
  }

  /**
   * Apply centering force to keep constellation centered
   */
  private applyCenterForce(nodes: ConstellationNode[]): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    for (const node of nodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;

      node.vx += dx * this.config.centerStrength * this.alpha;
      node.vy += dy * this.config.centerStrength * this.alpha;
    }
  }

  /**
   * Apply collision detection and response
   */
  private applyCollisionForce(nodes: ConstellationNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const minDist = nodeA.radius + nodeB.radius + this.config.minDistance;

        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const force = overlap * 0.5;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodeA.vx -= fx / nodeA.mass;
          nodeA.vy -= fy / nodeA.mass;
          nodeB.vx += fx / nodeB.mass;
          nodeB.vy += fy / nodeB.mass;
        }
      }
    }
  }

  /**
   * Calculate node radius based on thought properties
   */
  private calculateNodeRadius(thought: Thought): number {
    const baseRadius = this.config.nodeRadius;
    const wonderBonus = (thought.wonderScore || 0) * 10;
    const contentBonus = Math.min(thought.content.length / 100, 5);

    return baseRadius + wonderBonus + contentBonus;
  }

  /**
   * Calculate node mass for physics simulation
   */
  private calculateNodeMass(thought: Thought): number {
    const baseMass = 1;
    const connectionMass = (thought.metadata?.connections?.length || 0) * 0.5;
    
    return baseMass + connectionMass;
  }

  /**
   * Calculate node color based on properties
   */
  private calculateNodeColor(thought: Thought): string {
    const wonderScore = thought.wonderScore || 0;

    if (wonderScore > 0.8) return '#FFD700'; // Gold for high wonder
    if (wonderScore > 0.5) return '#87CEEB'; // Sky blue for medium
    if (wonderScore > 0.3) return '#98FB98'; // Pale green for low
    
    return '#D3D3D3'; // Light gray for no wonder
  }

  /**
   * Restart simulation with new alpha
   */
  restart(alpha: number = 1.0): void {
    this.alpha = alpha;
  }

  /**
   * Update layout config
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current simulation temperature
   */
  getAlpha(): number {
    return this.alpha;
  }

  /**
   * Check if simulation has cooled down
   */
  isStable(): boolean {
    return this.alpha < this.alphaMin;
  }
}

export const layoutEngine = new LayoutEngine();
