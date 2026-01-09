import React, { useEffect, useState, useCallback } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { AuthContext } from './AuthContextCore';
import type { AuthContextType } from './AuthContextCore';
import { setAuthTokenGetter, AdminService } from '../services/admin-service';
import { setFirebaseAuthTokenGetter } from '../services/firebase-service';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: kindeUser, isAuthenticated, isLoading, logout: kindeLogout, getClaim, getToken } = useKindeAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminCheckComplete, setIsAdminCheckComplete] = useState(false);
  const [profileData, setProfileData] = useState<{ username: string; email: string } | null>(null);

  // Set up token getter for API calls
  useEffect(() => {
    const tokenGetter = async () => {
      const token = await getToken();
      return token || '';
    };
    setAuthTokenGetter(tokenGetter);
    setFirebaseAuthTokenGetter(tokenGetter);
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    if (isAuthenticated && kindeUser) {
      try {
        const profile = await AdminService.getUserProfile();
        setProfileData({
          username: profile.username,
          email: profile.email
        });
      } catch (err) {
        console.warn('[AuthContext] Could not fetch custom profile, using Kinde defaults', err);
      }
    }
  }, [isAuthenticated, kindeUser]);

  useEffect(() => {
    const init = async () => {
      try {
        if (!isLoading && isAuthenticated && kindeUser) {
          setIsAdminCheckComplete(false); // Reset ao iniciar check

          // Check if user has admin role from Kinde token claims
          const rolesClaim = await getClaim('roles');

          let hasAdminRole = false;
          const rolesValue = rolesClaim?.value;

          if (Array.isArray(rolesValue)) {
            hasAdminRole = rolesValue.some((role: string | { key?: string; name?: string }) => {
              if (typeof role === 'string') {
                return role === 'admin';
              } else if (typeof role === 'object' && role !== null) {
                return role.key === 'admin' || role.name === 'Admin';
              }
              return false;
            });
          }

          setIsAdmin(hasAdminRole);
          setIsAdminCheckComplete(true); // Marcar como completo após verificação

          // Initial profile fetch
          await fetchProfile();
        } else if (!isAuthenticated) {
          setIsAdmin(false);
          setProfileData(null);
          setIsAdminCheckComplete(true); // Não autenticado = check completo
        }
      } catch (err) {
        console.error('[AuthContext] Auth sync error:', err);
        setIsAdmin(false);
        setIsAdminCheckComplete(true); // Erro = check completo
      }
    };
    init();
  }, [isLoading, isAuthenticated, kindeUser, getClaim, fetchProfile]);

  const logout = async () => {
    await kindeLogout();
  };

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const contextValue: AuthContextType = {
    user: kindeUser
      ? {
          username: profileData?.username || kindeUser.givenName || kindeUser.familyName || kindeUser.email?.split('@')[0] || '',
          email: profileData?.email || kindeUser.email || '',
          isAdmin,
        }
      : null,
    loading: isLoading,
    logout,
    refreshProfile,
    isAdminCheckComplete,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
