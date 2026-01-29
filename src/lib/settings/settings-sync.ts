/**
 * Settings Sync - Synchronize settings across devices and with the server
 */

import type { UserSettings } from './settings-types';
import { settingsManager } from './settings-manager';

// ============================================================================
// Types
// ============================================================================

export interface SyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  hasLocalChanges: boolean;
  error: string | null;
}

export interface SyncResult {
  success: boolean;
  merged: boolean;
  conflicts: string[];
  error?: string;
}

type SyncListener = (status: SyncStatus) => void;

// ============================================================================
// Settings Sync Class
// ============================================================================

class SettingsSync {
  private status: SyncStatus = {
    lastSyncedAt: null,
    isSyncing: false,
    hasLocalChanges: false,
    error: null,
  };
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private pendingChanges: Partial<UserSettings> | null = null;
  private initialized: boolean = false;

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  initialize(): void {
    if (this.initialized) return;

    // Listen for local settings changes
    settingsManager.subscribe(() => {
      this.status.hasLocalChanges = true;
      this.notifyListeners();
    });

    // Load last sync status
    this.loadSyncStatus();

    this.initialized = true;
  }

  // --------------------------------------------------------------------------
  // Sync Operations
  // --------------------------------------------------------------------------

  /**
   * Start automatic syncing
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.status.hasLocalChanges) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync settings with the server
   */
  async sync(): Promise<SyncResult> {
    if (this.status.isSyncing) {
      return {
        success: false,
        merged: false,
        conflicts: [],
        error: 'Sync already in progress',
      };
    }

    this.status.isSyncing = true;
    this.status.error = null;
    this.notifyListeners();

    try {
      const localSettings = settingsManager.getSettings();

      // Fetch remote settings
      const remoteSettings = await this.fetchRemoteSettings();

      if (remoteSettings) {
        // Merge settings
        const { merged, conflicts } = this.mergeSettings(localSettings, remoteSettings);

        if (conflicts.length > 0) {
          // For now, local settings take precedence
          console.warn('Settings conflicts detected:', conflicts);
        }

        // Update local settings with merged result
        settingsManager.updateSettings(merged);

        // Push merged settings to server
        await this.pushSettings(merged as UserSettings);
      } else {
        // No remote settings, push local settings
        await this.pushSettings(localSettings);
      }

      this.status.lastSyncedAt = new Date().toISOString();
      this.status.hasLocalChanges = false;
      this.saveSyncStatus();

      return {
        success: true,
        merged: !!remoteSettings,
        conflicts: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.status.error = errorMessage;

      return {
        success: false,
        merged: false,
        conflicts: [],
        error: errorMessage,
      };
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Force push local settings to server
   */
  async forcePush(): Promise<SyncResult> {
    this.status.isSyncing = true;
    this.notifyListeners();

    try {
      const localSettings = settingsManager.getSettings();
      await this.pushSettings(localSettings);

      this.status.lastSyncedAt = new Date().toISOString();
      this.status.hasLocalChanges = false;
      this.saveSyncStatus();

      return { success: true, merged: false, conflicts: [] };
    } catch (error) {
      return {
        success: false,
        merged: false,
        conflicts: [],
        error: error instanceof Error ? error.message : 'Push failed',
      };
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Force pull settings from server
   */
  async forcePull(): Promise<SyncResult> {
    this.status.isSyncing = true;
    this.notifyListeners();

    try {
      const remoteSettings = await this.fetchRemoteSettings();

      if (remoteSettings) {
        settingsManager.updateSettings(remoteSettings);
        this.status.lastSyncedAt = new Date().toISOString();
        this.status.hasLocalChanges = false;
        this.saveSyncStatus();

        return { success: true, merged: false, conflicts: [] };
      }

      return {
        success: false,
        merged: false,
        conflicts: [],
        error: 'No remote settings found',
      };
    } catch (error) {
      return {
        success: false,
        merged: false,
        conflicts: [],
        error: error instanceof Error ? error.message : 'Pull failed',
      };
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  // --------------------------------------------------------------------------
  // API Operations (placeholders - implement with actual API)
  // --------------------------------------------------------------------------

  private async fetchRemoteSettings(): Promise<Partial<UserSettings> | null> {
    // TODO: Implement actual API call
    // const response = await fetch('/api/settings');
    // if (!response.ok) return null;
    // return response.json();

    // For now, return null (no remote settings)
    return null;
  }

  private async pushSettings(settings: UserSettings): Promise<void> {
    // TODO: Implement actual API call
    // await fetch('/api/settings', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(settings),
    // });

    // For now, just log
    console.log('Settings would be pushed to server:', settings);
  }

  // --------------------------------------------------------------------------
  // Merge Logic
  // --------------------------------------------------------------------------

  private mergeSettings(
    local: UserSettings,
    remote: Partial<UserSettings>
  ): { merged: Partial<UserSettings>; conflicts: string[] } {
    const merged: Partial<UserSettings> = { ...local };
    const conflicts: string[] = [];

    for (const category of Object.keys(remote) as (keyof UserSettings)[]) {
      const localCategory = local[category];
      const remoteCategory = remote[category];

      if (!remoteCategory) continue;

      merged[category] = { ...localCategory };

      for (const key of Object.keys(remoteCategory)) {
        const localValue = localCategory[key as keyof typeof localCategory];
        const remoteValue = remoteCategory[key as keyof typeof remoteCategory];

        if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
          conflicts.push(`${category}.${key}`);
          // Local takes precedence by default
          // Override this behavior based on timestamp or user preference
        }
      }
    }

    return { merged, conflicts };
  }

  // --------------------------------------------------------------------------
  // Status Management
  // --------------------------------------------------------------------------

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  private loadSyncStatus(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('nchat-sync-status');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.status.lastSyncedAt = parsed.lastSyncedAt || null;
      }
    } catch {
      // Ignore errors
    }
  }

  private saveSyncStatus(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'nchat-sync-status',
        JSON.stringify({
          lastSyncedAt: this.status.lastSyncedAt,
        })
      );
    } catch {
      // Ignore errors
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const settingsSync = new SettingsSync();

// ============================================================================
// Convenience Functions
// ============================================================================

export function initializeSync(): void {
  settingsSync.initialize();
}

export function startAutoSync(intervalMs?: number): void {
  settingsSync.startAutoSync(intervalMs);
}

export function stopAutoSync(): void {
  settingsSync.stopAutoSync();
}

export function syncSettings(): Promise<SyncResult> {
  return settingsSync.sync();
}

export function forcePushSettings(): Promise<SyncResult> {
  return settingsSync.forcePush();
}

export function forcePullSettings(): Promise<SyncResult> {
  return settingsSync.forcePull();
}

export function getSyncStatus(): SyncStatus {
  return settingsSync.getStatus();
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  return settingsSync.subscribe(listener);
}
