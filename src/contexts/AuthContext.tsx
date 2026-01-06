import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { AuthContext } from './AuthContextCore';
import type { AuthContextType } from './AuthContextCore';
import { setAuthTokenGetter } from '../services/admin-service';
import { setFirebaseAuthTokenGetter } from '../services/firebase-service';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: kindeUser, isAuthenticated, isLoading, logout: kindeLogout, getClaim, getToken } = useKindeAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Set up token getter for API calls
  useEffect(() => {
    const tokenGetter = async () => {
      const token = await getToken();
      return token || '';
    };
    setAuthTokenGetter(tokenGetter);
    setFirebaseAuthTokenGetter(tokenGetter);
  }, [getToken]);

  useEffect(() => {
    const init = async () => {
      try {
        if (isAuthenticated && kindeUser) {
          // Check if user has admin role from Kinde token claims
          // Requires "Roles (array)" to be enabled in Kinde > Settings > Applications > [App] > Tokens > Token Customization
          const rolesClaim = await getClaim('roles');
          
          let hasAdminRole = false;
          const rolesValue = rolesClaim?.value;
          
          if (Array.isArray(rolesValue)) {
            // Roles can be either strings like ["admin"] or objects like [{key: "admin", name: "Admin"}]
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
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[AuthContext] Auth sync error:', err);
        setIsAdmin(false);
      }
    };
    init();
  }, [isLoading, isAuthenticated, kindeUser, getClaim]);

  const logout = async () => {
    await kindeLogout();
  };

  const contextValue: AuthContextType = {
    user: kindeUser
      ? {
          username: kindeUser.givenName || kindeUser.familyName || kindeUser.email?.split('@')[0] || '',
          email: kindeUser.email || '',
          isAdmin,
        }
      : null,
    loading: isLoading,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
