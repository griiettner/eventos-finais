import React, { useEffect, useState } from 'react';
import { DBService } from '../db/db-service';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

const SyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const triggerSync = async () => {
    setSyncStatus('syncing');

    try {
      // 1. Get unsynced answers
      const unsynced = await DBService.getAll('SELECT * FROM user_answers WHERE synced = 0');

      if (unsynced.length > 0) {
        console.log('Syncing items:', unsynced.length);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 2. Mark as synced
        await DBService.exec('UPDATE user_answers SET synced = 1 WHERE synced = 0');
      }

      setLastSync(new Date());
      setSyncStatus('online');
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('online'); // Reset to online even if sync fails
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('online');
      triggerSync();
    };
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync with a small delay to avoid cascading render warning
    let timer: number;
    if (navigator.onLine) {
      timer = window.setTimeout(() => triggerSync(), 100);
    } else {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className='sync-status-indicator'>
      {syncStatus === 'syncing' ? (
        <RefreshCw size={16} className='spin' />
      ) : syncStatus === 'offline' ? (
        <CloudOff size={16} color='#ff4d4d' />
      ) : (
        <Cloud size={16} color='#4caf50' />
      )}
      <span>
        {syncStatus === 'syncing'
          ? 'Sincronizando...'
          : syncStatus === 'offline'
          ? 'Modo Offline'
          : lastSync
          ? `Sincronizado ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Online'}
      </span>

      <style>{`
        .sync-status-indicator {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          border: 1px solid var(--glass-border);
          font-size: 0.75rem;
          color: var(--text-dim);
          z-index: 2000;
          pointer-events: none;
        }
        .spin {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncManager;
