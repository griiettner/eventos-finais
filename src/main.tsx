import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID || ''}
      domain={import.meta.env.VITE_KINDE_DOMAIN || ''}
      redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URL || window.location.origin}
      logoutUri={import.meta.env.VITE_KINDE_LOGOUT_URL || window.location.origin}
      onRedirectCallback={(user, appState) => {
        console.log('Kinde redirect callback:', user, appState);
        // Redirect to dashboard after successful auth
        window.location.href = appState?.redirectTo || '/dashboard';
      }}
    >
      <App />
    </KindeProvider>
  </StrictMode>
);
