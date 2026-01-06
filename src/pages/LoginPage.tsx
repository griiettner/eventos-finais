import React, { useState, useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw } from 'lucide-react';

const GoogleIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.11c-.22-.67-.35-1.38-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
      fill='#EA4335'
    />
  </svg>
);

const FacebookIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' fill='#1877F2' xmlns='http://www.w3.org/2000/svg'>
    <path d='M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.39 11.02 10.12 12V15.56H7.62v-3.49h2.5V9.41c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.22.19 2.22.19v2.44h-1.25c-1.22 0-1.6.76-1.6 1.54v1.85h2.75l-.44 3.49h-2.31V24.07C19.61 23.09 24 18.1 24 12.07z' />
  </svg>
);

const AppleIcon = () => (
  <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
    <path d='M17.05 20.28c-.96.95-2.04 1.72-3.23 1.72-1.16 0-1.54-.73-2.91-.73-1.35 0-1.8.72-2.91.72-1.1 0-2.3-.85-3.27-1.81-2.03-1.99-3.55-5.63-3.55-8.81 0-5.1 3.22-7.8 6.27-7.8 1.13 0 2.11.41 2.8.41.67 0 1.83-.49 3.12-.49.54 0 2.17.06 3.2 1.54-2.61 1.51-2.18 5.12.39 6.23-1.02 2.37-2.37 5.13-3.21 6.32zM12.03 4.65c-.07-2.5 2.1-4.65 4.54-4.65.17 2.44-2.14 4.79-4.54 4.65z' />
  </svg>
);

const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, isLoading: kindeLoading } = useKindeAuth();
  const [isAppleDevice] = useState(() => {
    const storedDevice = localStorage.getItem('is_apple_device');
    if (storedDevice !== null) {
      return storedDevice === 'true';
    }
    const platform = navigator.platform.toLowerCase();
    const isApple =
      /iphone|ipad|ipod|macintosh|macintel/.test(platform) ||
      (navigator.maxTouchPoints > 0 && /macintosh/.test(navigator.userAgent.toLowerCase()));
    localStorage.setItem('is_apple_device', isApple.toString());
    return isApple;
  });
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const signInWith = async (provider: 'google' | 'facebook' | 'apple') => {
    console.log('Starting OAuth with provider:', provider);
    
    // Get the actual Connection ID from environment
    const connectionIds: Record<string, string> = {
      google: import.meta.env.VITE_KINDE_GOOGLE_CONNECTION_ID,
      facebook: import.meta.env.VITE_KINDE_FACEBOOK_CONNECTION_ID,
      apple: import.meta.env.VITE_KINDE_APPLE_CONNECTION_ID,
    };
    
    const connectionId = connectionIds[provider];
    console.log('Using connectionId:', connectionId);
    
    // Use register instead of login - this will:
    // 1. Create the account if it doesn't exist (first-time users)
    // 2. Sign in the user if they already have an account
    // This avoids the "We can't find your account" screen
    await register({
      connectionId,
    });
  };

  const handleEmailSignIn = async () => {
    console.log('Starting email sign-in');
    await login();
  };

  return (
    <div className='login-container'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='card login-card'
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="logo-wrapper"
        >
          <img src="/logo.png" alt="Eventos Finais Logo" className="landing-logo" />
        </motion.div>
        <div className='logo-section'>
          <h1>Estudos Eventos Finais</h1>
          <p>Bem-vindo! Acesse sua jornada</p>
        </div>

        <div className={`social-login-grid ${isAppleDevice ? 'has-apple' : ''}`}>
          <button
            className='social-btn glass'
            onClick={() => signInWith('google')}
            disabled={kindeLoading}
            aria-label='Google Login'
          >
            <GoogleIcon /> Google
          </button>
          <button
            className='social-btn glass'
            onClick={() => signInWith('facebook')}
            disabled={kindeLoading}
            aria-label='Facebook Login'
          >
            <FacebookIcon /> Facebook
          </button>
          {isAppleDevice && (
            <button
              className='social-btn apple-btn'
              onClick={() => signInWith('apple')}
              disabled={kindeLoading}
              aria-label='Apple Login'
            >
              <AppleIcon /> Sign in with Apple
            </button>
          )}
        </div>

        <div className='divider'>
          <span>ou continue com e-mail</span>
        </div>

        <button
          onClick={handleEmailSignIn}
          className='btn-primary w-full'
          disabled={kindeLoading}
        >
          {kindeLoading ? (
            <RefreshCw size={20} className='spin' />
          ) : (
            <>
              <Mail size={18} /> Entrar com E-mail
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default LoginPage;
