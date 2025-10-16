import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
}

const CACHE_PREFIX = '@chartedart_cache:';
const SYNC_QUEUE_KEY = '@chartedart_sync_queue';
const OFFLINE_DATA_KEY = '@chartedart_offline_data';

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private syncQueue: SyncQueueItem[] = [];
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // If we just came back online, process sync queue
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  /**
   * Subscribe to network status changes
   */
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check if device is currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cache data with optional expiration
   */
  async cacheData<T>(key: string, data: T, expiresIn?: number): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn,
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data if not expired
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (cacheItem.expiresIn) {
        const age = Date.now() - cacheItem.timestamp;
        if (age > cacheItem.expiresIn) {
          await this.clearCache(key);
          return null;
        }
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear specific cache
   */
  async clearCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Add operation to sync queue for later execution
   */
  async addToSyncQueue(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: `${Date.now()}_${Math.random()}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(item);
    await this.saveSyncQueue();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Process sync queue when back online
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`Processing ${this.syncQueue.length} queued operations...`);

    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        // Here you would make the actual API call
        // For now, we'll just log it
        console.log(`Syncing: ${item.method} ${item.endpoint}`);
        
        // If sync fails, add back to queue with retry count
        // if (failed && item.retryCount < 3) {
        //   item.retryCount++;
        //   this.syncQueue.push(item);
        // }
      } catch (error) {
        console.error('Error syncing item:', error);
        // Add back to queue if retry count is low
        if (item.retryCount < 3) {
          item.retryCount++;
          this.syncQueue.push(item);
        }
      }
    }

    await this.saveSyncQueue();
  }

  /**
   * Get pending sync count
   */
  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Save offline data (for browsing previously viewed items)
   */
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  /**
   * Get all offline data
   */
  async getOfflineData(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting offline data:', error);
      return {};
    }
  }

  /**
   * Get specific offline data
   */
  async getOfflineDataByKey(key: string): Promise<any | null> {
    try {
      const offlineData = await this.getOfflineData();
      return offlineData[key]?.data || null;
    } catch (error) {
      console.error('Error getting offline data by key:', error);
      return null;
    }
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }
}

export const offlineManager = OfflineManager.getInstance();
