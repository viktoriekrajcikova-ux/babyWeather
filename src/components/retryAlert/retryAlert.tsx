import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './retryAlert.module.scss';

interface RetryAlertProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

const RetryAlert = ({ message, onRetry, isRetrying }: RetryAlertProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.alert}>
      <p>{message}</p>
      <Button
        type="button"
        variant="outline-secondary"
        size="sm"
        disabled={isRetrying}
        onClick={onRetry}
      >
        {isRetrying ? t('common.retrying') : t('common.tryAgain')}
      </Button>
    </div>
  );
};

export default RetryAlert;
