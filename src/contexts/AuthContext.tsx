import React, { useState, useEffect } from 'react';
import { DBService } from '../db/db-service';
import { AuthContext } from './AuthContextCore';
import type { UserProfile } from './AuthContextCore';

interface UserProfileRow {
  username: string;
  email: string;
  is_verified: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await DBService.init();
        const profile = await DBService.get<UserProfileRow>('SELECT * FROM user_profile WHERE id = 1');
        if (profile) {
          setUser({
            username: profile.username,
            email: profile.email,
            isVerified: !!profile.is_verified,
          });
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (username: string, email: string) => {
    await DBService.exec('INSERT OR REPLACE INTO user_profile (id, username, email, is_verified) VALUES (1, ?, ?, 0)', [
      username,
      email,
    ]);
    setUser({ username, email, isVerified: false });
  };

  const verify = async () => {
    await DBService.exec('UPDATE user_profile SET is_verified = 1 WHERE id = 1');
    if (user) {
      setUser({ ...user, isVerified: true });
    }
  };

  const logout = async () => {
    await DBService.exec('DELETE FROM user_profile WHERE id = 1');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, verify, logout }}>{children}</AuthContext.Provider>;
};
