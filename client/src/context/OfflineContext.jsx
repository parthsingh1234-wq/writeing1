import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() => {
    const saved = localStorage.getItem('vault_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineDraft = (articleData) => {
    setSyncQueue((prev) => {
      const filtered = prev.filter(item => item.id !== articleData.id);
      const updated = [...filtered, { ...articleData, timestamp: Date.now() }];
      localStorage.setItem('vault_offline_queue', JSON.stringify(updated));
      return updated;
    });
  };

  const triggerSync = async () => {
    const queue = JSON.parse(localStorage.getItem('vault_offline_queue') || '[]');
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      for (const item of queue) {
        if (item.id && !item.id.startsWith('temp_')) {
          await API.put(`/articles/${item.id}`, item);
        } else {
          await API.post('/articles', item);
        }
      }
      localStorage.removeItem('vault_offline_queue');
      setSyncQueue([]);
      console.log('Successfully synchronized offline drafts!');
    } catch (err) {
      console.error('Offline draft sync error:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider value={{
      isOnline,
      syncQueueCount: syncQueue.length,
      isSyncing,
      saveOfflineDraft,
      triggerSync
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
