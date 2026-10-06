import { createContext, useContext } from 'react';

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
}

interface ToastContextValue {
  showError: (notification: ErrorNotification) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
