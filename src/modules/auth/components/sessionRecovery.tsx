import { useEffect } from 'react';
import { useToast } from '../../../components/toast/toastContext';

export default function SessionRecovery({ onRetry }: { onRetry: () => void }) {
  const { showError, dismiss } = useToast();

  useEffect(() => {
    showError({
      id: 'auth-session',
      title: 'Could not restore your session',
      message: 'Check your connection and try again.',
    });
    return () => dismiss('auth-session');
  }, [showError, dismiss]);

  return (
    <main className="container py-4">
      <p>Account access is currently unavailable.</p>
      <button type="button" className="btn btn-outline-secondary" onClick={onRetry}>
        Try again
      </button>
    </main>
  );
}
