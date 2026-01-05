import { createContext } from 'react';

export interface UserProfile {
  username: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
