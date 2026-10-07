import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/toast/toastContext';

export default function SessionRecovery({ onRetry }: { onRetry: () => void }) {
  const { showError, dismiss } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    showError({
      id: 'auth-session',
      title: t('auth.sessionRecovery.title'),
      message: t('auth.sessionRecovery.message'),
    });
    return () => dismiss('auth-session');
  }, [showError, dismiss, t]);

  return (
    <main className="container py-4">
      <p>{t('auth.sessionRecovery.unavailable')}</p>
      <button type="button" className="btn btn-outline-secondary" onClick={onRetry}>
        {t('common.tryAgain')}
      </button>
    </main>
  );
}
