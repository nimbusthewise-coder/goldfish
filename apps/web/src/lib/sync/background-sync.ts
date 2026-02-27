/**
 * Background synchronization service for thoughts
 * Syncs local data to server when connection is available
 */

import type { Thought } from '@/types/thought';

export interface SyncConfig {
  endpoint?: string;
  syncInterval?: number; // milliseconds
  retryDelay?: number; // milliseconds
  maxRetries?: number;
  batchSize?: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: string[];
}

class BackgroundSyncService {
  private config: Required<SyncConfig>;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = true;

  constructor(config: SyncConfig = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/thoughts/sync',
      syncInterval: config.syncInterval || 30000, // 30 seconds
      retryDelay: config.retryDelay || 5000, // 5 seconds
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 10,
    };

    // Listen to online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    console.log('Connection restored - triggering sync');
    this.triggerSync();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    console.log('Connection lost - sync paused');
  };

  start(onSync: () => Promise<Thought[]>): void {
    if (this.syncTimer) {
      console.warn('Sync already started');
      return;
    }

    console.log('Starting background sync service');

    this.syncTimer = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        const pendingThoughts = await onSync();
        if (pendingThoughts.length > 0) {
          await this.syncThoughts(pendingThoughts);
        }
      }
    }, this.config.syncInterval);

    // Trigger immediate sync if online
    if (this.isOnline) {
      setTimeout(() => this.triggerSync(), 1000);
    }
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Background sync service stopped');
    }
  }

  async triggerSync(): Promise<void> {
    // This would be called by the store
    console.log('Manual sync triggered');
  }

  async syncThoughts(thoughts: Thought[]): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, synced: 0, failed: 0, errors: ['Sync in progress'] };
    }

    if (!this.isOnline) {
      console.log('Cannot sync - offline');
      return { success: false, synced: 0, failed: 0, errors: ['Offline'] };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Process in batches
      for (let i = 0; i < thoughts.length; i += this.config.batchSize) {
        const batch = thoughts.slice(i, i + this.config.batchSize);
        
        try {
          await this.syncBatch(batch);
          synced += batch.length;
        } catch (error) {
          failed += batch.length;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Batch ${i / this.config.batchSize + 1}: ${errorMsg}`);
        }
      }

      return {
        success: failed === 0,
        synced,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncBatch(thoughts: Thought[]): Promise<void> {
    // In a real implementation, this would send data to the server
    // For now, simulate a network request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.9) {
          reject(new Error('Simulated network error'));
        } else {
          console.log(`Synced ${thoughts.length} thoughts`);
          resolve();
        }
      }, 100);
    });
  }

  async uploadAudio(thoughtId: string, audioBlob: Blob): Promise<string> {
    if (!this.isOnline) {
      throw new Error('Cannot upload audio - offline');
    }

    // In a real implementation, this would upload to cloud storage
    // For now, return a placeholder URL
    const audioUrl = `https://storage.example.com/audio/${thoughtId}.webm`;
    console.log(`Audio uploaded: ${audioUrl}`);
    return audioUrl;
  }

  getStatus(): { online: boolean; syncing: boolean } {
    return {
      online: this.isOnline,
      syncing: this.isSyncing,
    };
  }

  cleanup(): void {
    this.stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}

export const backgroundSync = new BackgroundSyncService();
