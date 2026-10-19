import { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function SessionRecovery({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    toast.error(`${t('auth.sessionRecovery.title')} ${t('auth.sessionRecovery.message')}`, {
      id: 'auth-session',
    });
    return () => toast.dismiss('auth-session');
  }, [t]);

  return (
    <main className="container py-4">
      <p>{t('auth.sessionRecovery.unavailable')}</p>
      <Button type="button" variant="outline-secondary" onClick={onRetry}>
        {t('common.tryAgain')}
      </Button>
    </main>
  );
}
