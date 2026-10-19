import type { Session } from '@supabase/supabase-js';
import { createContext } from 'react';

export interface AuthContextValue {
  session: Session | null | undefined;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<Session | null>;
  signOut: () => Promise<void>;
  getAuthGeneration: () => number;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
