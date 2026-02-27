/**
 * Animation Engine
 * Handles smooth transitions and visual effects
 */

import { ConstellationNode, Connection } from '@/types/constellation';

export interface AnimationConfig {
  duration: number;
  easing: (t: number) => number;
}

export type EasingFunction = (t: number) => number;

// Common easing functions
export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  }
};

interface AnimationState {
  startTime: number;
  duration: number;
  easing: EasingFunction;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export class AnimationEngine {
  private animations: Map<string, AnimationState> = new Map();
  private rafId: number | null = null;

  /**
   * Start a new animation
   */
  animate(
    id: string,
    duration: number,
    onUpdate: (progress: number) => void,
    onComplete?: () => void,
    easing: EasingFunction = easings.easeInOut
  ): void {
    this.animations.set(id, {
      startTime: performance.now(),
      duration,
      easing,
      onUpdate,
      onComplete
    });

    if (this.rafId === null) {
      this.startLoop();
    }
  }

  /**
   * Cancel an animation
   */
  cancel(id: string): void {
    this.animations.delete(id);

    if (this.animations.size === 0 && this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Cancel all animations
   */
  cancelAll(): void {
    this.animations.clear();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation loop
   */
  private startLoop(): void {
    const loop = (timestamp: number) => {
      const completed: string[] = [];

      this.animations.forEach((state, id) => {
        const elapsed = timestamp - state.startTime;
        const rawProgress = Math.min(elapsed / state.duration, 1);
        const easedProgress = state.easing(rawProgress);

        state.onUpdate(easedProgress);

        if (rawProgress >= 1) {
          completed.push(id);
          state.onComplete?.();
        }
      });

      // Remove completed animations
      completed.forEach(id => this.animations.delete(id));

      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Interpolate between two nodes
   */
  static interpolateNodes(
    from: ConstellationNode,
    to: ConstellationNode,
    progress: number
  ): ConstellationNode {
    return {
      ...to,
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      radius: from.radius + (to.radius - from.radius) * progress,
      glowIntensity: from.glowIntensity + (to.glowIntensity - from.glowIntensity) * progress
    };
  }

  /**
   * Interpolate between two connection states
   */
  static interpolateConnections(
    from: Connection,
    to: Connection,
    progress: number
  ): Connection {
    return {
      ...to,
      strength: from.strength + (to.strength - from.strength) * progress,
      glowIntensity: from.glowIntensity + (to.glowIntensity - from.glowIntensity) * progress
    };
  }
}

/**
 * Glow pulse animation calculator
 */
export class GlowAnimator {
  private time: number = 0;

  /**
   * Update time
   */
  update(delta: number): void {
    this.time += delta;
  }

  /**
   * Calculate glow intensity for a node
   */
  getNodeGlow(baseIntensity: number, frequency: number = 1): number {
    const pulse = Math.sin(this.time * frequency) * 0.5 + 0.5;
    return baseIntensity * (0.7 + pulse * 0.3);
  }

  /**
   * Calculate glow intensity for a connection
   */
  getConnectionGlow(
    baseIntensity: number,
    strength: number,
    frequency: number = 0.5
  ): number {
    const pulse = Math.sin(this.time * frequency + strength * Math.PI) * 0.5 + 0.5;
    return baseIntensity * (0.5 + pulse * 0.5);
  }

  /**
   * Reset time
   */
  reset(): void {
    this.time = 0;
  }
}

/**
 * Particle effect for visual flourishes
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 100;

  /**
   * Emit particles from a position
   */
  emit(
    x: number,
    y: number,
    count: number,
    color: string = '#FFD700'
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: Math.random() * 1000 + 500,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  /**
   * Update all particles
   */
  update(delta: number): void {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= delta / p.maxLife;
      return p.life > 0;
    });
  }

  /**
   * Get current particles
   */
  getParticles(): Particle[] {
    return this.particles;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }
}

export const animationEngine = new AnimationEngine();
export const glowAnimator = new GlowAnimator();
export const particleSystem = new ParticleSystem();
