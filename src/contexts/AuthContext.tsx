import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { DBService } from '../db/db-service';
import { AuthContext } from './AuthContextCore';
import type { AuthContextType } from './AuthContextCore';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: kindeUser, isAuthenticated, isLoading, logout: kindeLogout, getClaim, getRoles } = useKindeAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[AuthContext] Init - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
        await DBService.init();
        if (isAuthenticated && kindeUser) {
          const email = kindeUser.email || '';
          const username = kindeUser.givenName || kindeUser.familyName || email.split('@')[0];

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

          // Update local state immediately
          setIsAdmin(hasAdminRole);

          // Sync to local database
          await DBService.exec(
            'INSERT OR REPLACE INTO user_profile (id, username, email, is_verified, is_admin) VALUES (1, ?, ?, 1, ?)',
            [username, email, hasAdminRole ? 1 : 0]
          );
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
    console.log('Iniciando processo de logout...');

    // Limpa o banco local
    console.log('Solicitando limpeza do banco de dados local...');
    DBService.exec('DELETE FROM user_profile WHERE id = 1').catch((err) => {
      console.warn('Erro ao limpar banco (não crítico para o logout):', err);
    });

    // Chama o logout do Kinde
    console.log('Chamando Kinde logout...');
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
