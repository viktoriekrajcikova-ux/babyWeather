import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext';
import { ChildrenKeys } from '../children/childrenQueryKeys';
import SessionRecovery from './components/sessionRecovery';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [sessionError, setSessionError] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const authGeneration = useRef(0);
  const getAuthGeneration = () => authGeneration.current;
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      authEventReceived = true;
      const nextUserId = nextSession?.user.id ?? null;
      const identityChanged = previousUserId.current !== nextUserId;

      if (event === 'SIGNED_OUT' || identityChanged) {
        authGeneration.current += 1;
        queryClient.removeQueries({ queryKey: ChildrenKeys.all });
      }

      previousUserId.current = nextUserId;
      setSessionError(false);
      setSession(nextSession);
    });

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active || authEventReceived) return;
        if (error) throw error;
        previousUserId.current = data.session?.user.id ?? null;
        setSessionError(false);
        setSession(data.session);
      } catch {
        if (!active || authEventReceived) return;
        setSessionError(true);
      }
    };
    void restoreSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient, sessionAttempt]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut, getAuthGeneration }}>
      {sessionError ? (
        <SessionRecovery
          onRetry={() => {
            setSessionError(false);
            setSessionAttempt((attempt) => attempt + 1);
          }}
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
