import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';
import './UpdateBanner.css';

interface VersionInfo {
  version: string;
  buildDate: string;
  critical: boolean;
}

const UpdateBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = useCallback(() => {
    setIsUpdating(true);
    if (versionInfo) {
      localStorage.setItem('app_version', versionInfo.version);
    }
    
    // Clear ALL caches and unregister SW for a clean slate
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(async registrations => {
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // Hard reload
        window.location.href = window.location.origin + '/?t=' + Date.now();
      });
    } else {
      window.location.reload();
    }
  }, [versionInfo]);

  const checkVersion = useCallback(async () => {
    // We'll check the state inside the function but won't depend on them for memoization
    // to avoid potential callback loops or stale closures if handled incorrectly.
    // However, to satisfy the compiler and ensure safety, we'll check it here.
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) return;
      
      const data: VersionInfo = await response.json();
      const localVersion = localStorage.getItem('app_version');

      console.log('[Version Check]', { remote: data.version, local: localVersion });

      if (localVersion && data.version !== localVersion) {
        setVersionInfo(data);
        setShowBanner(true);
        
        if (data.critical) {
          setTimeout(() => {
            handleUpdate();
          }, 5000);
        }
      } else if (!localVersion) {
        localStorage.setItem('app_version', data.version);
      }
    } catch (error) {
      console.error('[Version Check] Failed:', error);
    }
  }, [handleUpdate]);

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      if (!isMounted || showBanner || isUpdating) return;
      await checkVersion();
    };

    // Initial check
    runCheck();

    // Check every 30 minutes
    const interval = setInterval(runCheck, 30 * 60 * 1000);
    
    // Check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runCheck();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion, showBanner, isUpdating]);

  if (!showBanner) return null;

  return (
    <div className={`update-banner ${versionInfo?.critical ? 'critical' : ''}`}>
      <div className="update-banner-content">
        {versionInfo?.critical ? (
          <AlertTriangle size={18} className="icon-alert" />
        ) : (
          <RefreshCw size={18} className={isUpdating ? 'spin' : 'spin-slow'} />
        )}
        <div className="update-text">
          <span className="update-title">Nova versão disponível! ({versionInfo?.version})</span>
          {versionInfo?.critical && (
            <span className="update-subtitle">Esta é uma atualização crítica. O app reiniciará em breve.</span>
          )}
        </div>
        <button 
          className="btn-refresh" 
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Atualizando...' : 'Atualizar agora'}
        </button>
      </div>
      {!versionInfo?.critical && (
        <button className="btn-close-banner" onClick={() => setShowBanner(false)}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default UpdateBanner;
