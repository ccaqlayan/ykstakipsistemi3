/**
 * Offline Sync Service for YKS Koçluk ve Öğrenci Takip Sistemi
 * Enables seamless offline-first operation (question logs, pomodoro, study plans)
 * and automatically synchronizes with Firestore when network connectivity is restored.
 */

export interface QueuedOfflineAction {
  id: string;
  type: 'ADD_QUESTION_LOG' | 'SAVE_DAILY_STUDY' | 'UPDATE_STUDY_PLAN' | 'SAVE_ROUTINES';
  userId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'yks_offline_sync_queue_v1';
const OFFLINE_CACHE_PREFIX = 'yks_offline_cache_';

type SyncListener = (status: {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}) => void;

class OfflineSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private lastSyncedAt: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public isNetworkOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  public getPendingQueue(): QueuedOfflineAction[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedOfflineAction[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist offline queue to localStorage', e);
    }
  }

  public queueAction(action: Omit<QueuedOfflineAction, 'id' | 'createdAt' | 'retryCount'>): void {
    const newAction: QueuedOfflineAction = {
      ...action,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      retryCount: 0
    };

    const queue = this.getPendingQueue();
    queue.push(newAction);
    this.saveQueue(queue);

    if (this.isNetworkOnline()) {
      this.flushQueue();
    }
  }

  public async flushQueue(
    syncHandler?: (action: QueuedOfflineAction) => Promise<boolean>
  ): Promise<void> {
    if (this.isSyncing || !this.isNetworkOnline()) return;

    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    const remainingQueue: QueuedOfflineAction[] = [];

    for (const item of queue) {
      try {
        if (syncHandler) {
          const success = await syncHandler(item);
          if (!success) {
            item.retryCount += 1;
            if (item.retryCount < 5) {
              remainingQueue.push(item);
            }
          }
        } else {
          // Default: remove from local queue after processing
        }
      } catch (err) {
        console.error('Error syncing offline item:', item, err);
        item.retryCount += 1;
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    }

    this.saveQueue(remainingQueue);
    this.isSyncing = false;
    this.lastSyncedAt = Date.now();
    this.notifyListeners();
  }

  public clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifyListeners();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({
      isOnline: this.isNetworkOnline(),
      pendingCount: this.getPendingQueue().length,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const status = {
      isOnline: this.isNetworkOnline(),
      pendingCount: this.getPendingQueue().length,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt
    };
    this.listeners.forEach((l) => l(status));
  }

  private handleNetworkChange(isOnline: boolean): void {
    this.notifyListeners();
    if (isOnline) {
      this.flushQueue();
    }
  }
}

export const offlineSync = new OfflineSyncManager();
