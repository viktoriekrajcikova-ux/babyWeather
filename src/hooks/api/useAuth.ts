import { useContext } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import type { AuthContextValue } from '../../context/auth/AuthContext';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
