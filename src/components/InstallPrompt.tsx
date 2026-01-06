import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, X } from 'lucide-react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Navigator interface for Safari's standalone property
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

// Helper functions to detect device state (called outside of effects)
const getIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as NavigatorStandalone).standalone === true || 
         document.referrer.includes('android-app://');
};

const getIsIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Initialize state with helper functions (avoids setState in useEffect)
  const [isIOS] = useState(getIsIOS);
  const [isStandalone] = useState(getIsStandalone);

  useEffect(() => {
    // Skip if already in standalone mode
    if (isStandalone) return;

    // Handle Android/Chrome prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show after a small delay to not annoy user immediately
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, we show it manually since there's no beforeinstallprompt
    if (isIOS) {
      const lastPrompt = localStorage.getItem('ios-install-prompt');
      const now = Date.now();
      // Show every 7 days if not dismissed
      if (!lastPrompt || now - parseInt(lastPrompt) > 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-install-prompt', Date.now().toString());
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt-card glass">
        <button className="btn-close-prompt" onClick={handleDismiss}>
          <X size={20} />
        </button>
        
        <div className="install-prompt-header">
          <div className="app-icon">
            <img src="/logo-v2.svg" alt="App Logo" />
          </div>
          <div className="app-info">
            <h3>Instalar App</h3>
            <p>Adicione à tela de início para uma melhor experiência.</p>
          </div>
        </div>

        <div className="install-instructions">
          {isIOS ? (
            <div className="ios-instructions">
              <div className="instruction-step">
                <div className="step-icon"><Share size={24} /></div>
                <div className="step-text">
                  <span className="step-number">1.</span> Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari
                </div>
              </div>
              <div className="instruction-step">
                <div className="step-icon"><PlusSquare size={24} /></div>
                <div className="step-text">
                  <span className="step-number">2.</span> Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="android-instructions">
              {deferredPrompt && (
                <button className="btn-install-now" onClick={handleInstallClick}>
                  <Smartphone size={18} /> Instalar Agora
                </button>
              )}
              <div className="manual-instructions">
                <p className="instructions-title">Ou instale manualmente:</p>
                <p>1. Toque no ícone <strong>⋮</strong> (três pontos) no canto superior direito</p>
                <p>2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
