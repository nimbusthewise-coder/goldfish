/**
 * Performance monitoring utilities for tracking sub-100ms save times
 */

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private history: PerformanceMetric[] = [];
  private maxHistorySize = 100;

  start(operation: string, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      metadata,
    };
    this.metrics.set(operation, metric);
  }

  end(operation: string): number | null {
    const metric = this.metrics.get(operation);
    if (!metric) {
      console.warn(`No start time found for operation: ${operation}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Add to history
    this.history.push({ ...metric });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Remove from active metrics
    this.metrics.delete(operation);

    // Log if exceeds 100ms threshold
    if (metric.duration > 100) {
      console.warn(
        `Performance threshold exceeded: ${operation} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      );
    }

    return metric.duration;
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.history.filter((m) => m.operation === operation);
    }
    return [...this.history];
  }

  getAverageDuration(operation: string): number | null {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return null;

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  clearHistory(): void {
    this.history = [];
    this.metrics.clear();
  }

  // Helper to measure a function execution
  async measure<T>(
    operation: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(operation, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(operation);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Utility to generate unique IDs efficiently
export function generateId(): string {
  // Use timestamp + random for uniqueness with minimal overhead
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility to get device ID (cached in sessionStorage)
export function getDeviceId(): string {
  const storageKey = 'goldfish-device-id';
  let deviceId = sessionStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = generateId();
    sessionStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}
