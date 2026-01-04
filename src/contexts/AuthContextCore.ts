import { createContext } from 'react';

export interface UserProfile {
  username: string;
  email: string;
  isVerified: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, email: string) => Promise<void>;
  verify: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
