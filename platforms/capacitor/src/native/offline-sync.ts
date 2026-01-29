/**
 * Offline Sync Service for Capacitor
 * Handles background sync and offline queue management
 */

import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export interface SyncOptions {
  retryAttempts?: number;
  retryDelay?: number;
  batchSize?: number;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  attempts: number;
}

class OfflineSyncService {
  private queue: QueuedAction[] = [];
  private isOnline = true;
  private isSyncing = false;
  private syncOptions: SyncOptions = {
    retryAttempts: 3,
    retryDelay: 5000,
    batchSize: 10,
  };

  /**
   * Initialize offline sync service
   */
  async initialize(options?: SyncOptions): Promise<void> {
    if (options) {
      this.syncOptions = { ...this.syncOptions, ...options };
    }

    // Load queue from storage
    await this.loadQueue();

    // Set up network monitoring
    await this.setupNetworkMonitoring();

    // Check initial network status
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    // Start sync if online
    if (this.isOnline && this.queue.length > 0) {
      await this.sync();
    }
  }

  /**
   * Set up network status monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      this.isOnline = status.connected;

      if (this.isOnline && this.queue.length > 0) {
        this.sync();
      }
    });
  }

  /**
   * Add action to offline queue
   */
  async addToQueue(type: string, payload: any): Promise<string> {
    const action: QueuedAction = {
      id: this.generateId(),
      type,
      payload,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.queue.push(action);
    await this.saveQueue();

    console.log('Action added to offline queue:', action);

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.sync();
    }

    return action.id;
  }

  /**
   * Sync queued actions
   */
  async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting offline sync...');

    try {
      // Process actions in batches
      const batch = this.queue.slice(0, this.syncOptions.batchSize);

      for (const action of batch) {
        try {
          await this.processAction(action);
          this.removeFromQueue(action.id);
        } catch (error) {
          console.error('Error processing action:', error);
          action.attempts++;

          if (action.attempts >= (this.syncOptions.retryAttempts || 3)) {
            console.error('Max retry attempts reached, removing action:', action);
            this.removeFromQueue(action.id);
          }
        }
      }

      await this.saveQueue();

      // Continue syncing if there are more items
      if (this.queue.length > 0) {
        setTimeout(() => {
          this.sync();
        }, this.syncOptions.retryDelay);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single queued action
   */
  private async processAction(action: QueuedAction): Promise<void> {
    console.log('Processing action:', action);

    // Implement action processing based on type
    switch (action.type) {
      case 'SEND_MESSAGE':
        await this.syncMessage(action.payload);
        break;
      case 'UPDATE_MESSAGE':
        await this.updateMessage(action.payload);
        break;
      case 'DELETE_MESSAGE':
        await this.deleteMessage(action.payload);
        break;
      case 'CREATE_CHANNEL':
        await this.createChannel(action.payload);
        break;
      case 'UPDATE_CHANNEL':
        await this.updateChannel(action.payload);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Sync message to server
   */
  private async syncMessage(payload: any): Promise<void> {
    console.log('Syncing message:', payload);
    // TODO: Implement actual API call
    // Example: await api.sendMessage(payload)
  }

  /**
   * Update message on server
   */
  private async updateMessage(payload: any): Promise<void> {
    console.log('Updating message:', payload);
    // TODO: Implement actual API call
  }

  /**
   * Delete message on server
   */
  private async deleteMessage(payload: any): Promise<void> {
    console.log('Deleting message:', payload);
    // TODO: Implement actual API call
  }

  /**
   * Create channel on server
   */
  private async createChannel(payload: any): Promise<void> {
    console.log('Creating channel:', payload);
    // TODO: Implement actual API call
  }

  /**
   * Update channel on server
   */
  private async updateChannel(payload: any): Promise<void> {
    console.log('Updating channel:', payload);
    // TODO: Implement actual API call
  }

  /**
   * Remove action from queue
   */
  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter((action) => action.id !== id);
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const result = await Preferences.get({ key: 'offline_sync_queue' });
      if (result.value) {
        this.queue = JSON.parse(result.value);
        console.log('Loaded offline queue:', this.queue.length, 'items');
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await Preferences.set({
        key: 'offline_sync_queue',
        value: JSON.stringify(this.queue),
      });
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force sync
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.sync();
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();
