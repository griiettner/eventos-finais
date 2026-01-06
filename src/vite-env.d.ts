/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KINDE_CLIENT_ID: string;
  readonly VITE_KINDE_DOMAIN: string;
  readonly VITE_KINDE_REDIRECT_URL: string;
  readonly VITE_KINDE_LOGOUT_URL: string;
  readonly VITE_KINDE_GOOGLE_CONNECTION_ID: string;
  readonly VITE_KINDE_FACEBOOK_CONNECTION_ID: string;
  readonly VITE_KINDE_APPLE_CONNECTION_ID: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
