import { Link } from 'react-router-dom';
import { Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Child } from '../../children.types';
import type { HourlyWeather } from '../../../weather/weather.types';
import { kelvinToRoundedCelsius } from '../../../weather/helpers/temperature';
import { packForToday } from '../../../clothing/helpers/packForToday';
import ChildPackingCard from '../childPackingCard/childPackingCard';
import styles from './childrenPacking.module.scss';
import RetryAlert from '../../../../components/retryAlert/retryAlert';

interface ChildrenPackingProps {
  kids: Child[];
  hourly: HourlyWeather[];
  error: string | null;
  onRetry: () => void;
  isFetching: boolean;
}

const ChildrenPacking = ({ kids, hourly, error, onRetry, isFetching }: ChildrenPackingProps) => {
  const { t } = useTranslation();
  if (hourly.length === 0 && !error) return null;

  const feels = hourly.map((hour) => kelvinToRoundedCelsius(hour.feels_like));

  return (
    <>
      {hourly.length > 0 && <h2 className={styles.sectionTitle}>{t('overview.packingTitle')}</h2>}
      {error ? (
        <RetryAlert message={error} onRetry={onRetry} isRetrying={isFetching} />
      ) : kids.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <Baby className={styles.emptyIcon} size={40} strokeWidth={2} aria-hidden="true" />
          <p>{t('overview.addHint')}</p>
          <Link to="/settings" className={styles.button}>
            {t('children.add')}
          </Link>
        </div>
      ) : (
        <div className={styles.plan}>
          {kids.map((child) => (
            <ChildPackingCard key={child.id} child={child} clothes={packForToday(child, feels)} />
          ))}
        </div>
      )}
    </>
  );
};

export default ChildrenPacking;
