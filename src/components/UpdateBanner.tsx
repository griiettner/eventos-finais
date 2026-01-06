import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import './UpdateBanner.css';

const UpdateBanner: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: Error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <RefreshCw size={18} className="spin-slow" />
        <span>Uma nova versão está disponível!</span>
        <button 
          className="btn-refresh" 
          onClick={() => updateServiceWorker(true)}
        >
          Atualizar agora
        </button>
      </div>
      <button className="btn-close-banner" onClick={close}>
        <X size={18} />
      </button>
    </div>
  );
};

export default UpdateBanner;
