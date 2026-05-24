import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseApiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);
  useEffect(() => {
    
      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
      });

      return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
  };
  const signUp = async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
  };
  const signOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
