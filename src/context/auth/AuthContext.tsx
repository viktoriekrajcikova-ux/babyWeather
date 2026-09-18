import { createContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseApiClient';
import { useQueryClient } from '@tanstack/react-query';
import { ChildrenKeys } from '../../hooks/api/childrenQueryKeys';

export interface AuthContextValue {
  session: Session | null | undefined;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthGeneration: () => number;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const authGeneration = useRef(0);
  const getAuthGeneration = () => authGeneration.current;
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } =    supabase.auth.onAuthStateChange((event, nextSession) => {
    if (!active) return;
    authEventReceived = true;
     const nextUserId = nextSession?.user.id ?? null;
     const identityChanged = previousUserId.current !== nextUserId;

     if (event === 'SIGNED_OUT' || identityChanged) {
       authGeneration.current += 1;
       queryClient.removeQueries({ queryKey: ChildrenKeys.all });
     }

     previousUserId.current = nextUserId;
     setSession(nextSession);
   });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || authEventReceived) return;
      previousUserId.current = session?.user.id ?? null;
      setSession(session);
    });

   return () => {
     active = false;
     subscription.unsubscribe();
   };
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut, getAuthGeneration }}>
      {children}
    </AuthContext.Provider>
  );
};
