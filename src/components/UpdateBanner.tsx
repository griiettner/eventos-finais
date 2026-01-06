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
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }, [versionInfo]);

  const checkVersion = useCallback(async () => {
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
    // Initial check
    const runCheck = async () => {
      await checkVersion();
    };
    runCheck();

    // Check every 30 minutes
    const interval = setInterval(checkVersion, 30 * 60 * 1000);
    
    // Check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

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
