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
      audience={import.meta.env.VITE_API_URL || 'http://localhost:3001'}
    >
      <App />
    </KindeProvider>
  </StrictMode>
);
