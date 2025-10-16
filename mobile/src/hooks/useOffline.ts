import { useState, useEffect } from 'react';
import { offlineManager } from '@/lib/offline/OfflineManager';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.getIsOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = offlineManager.onNetworkChange((online) => {
      setIsOnline(online);
      updatePendingSyncCount();
    });

    updatePendingSyncCount();

    return unsubscribe;
  }, []);

  const updatePendingSyncCount = () => {
    setPendingSyncCount(offlineManager.getPendingSyncCount());
  };

  const cacheData = async <T,>(key: string, data: T, expiresIn?: number) => {
    await offlineManager.cacheData(key, data, expiresIn);
  };

  const getCachedData = async <T,>(key: string): Promise<T | null> => {
    return await offlineManager.getCachedData<T>(key);
  };

  const saveOfflineData = async (key: string, data: any) => {
    await offlineManager.saveOfflineData(key, data);
  };

  const getOfflineData = async (key: string) => {
    return await offlineManager.getOfflineDataByKey(key);
  };

  const addToSyncQueue = async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: any
  ) => {
    await offlineManager.addToSyncQueue(endpoint, method, data);
    updatePendingSyncCount();
  };

  return {
    isOnline,
    pendingSyncCount,
    cacheData,
    getCachedData,
    saveOfflineData,
    getOfflineData,
    addToSyncQueue,
  };
};
