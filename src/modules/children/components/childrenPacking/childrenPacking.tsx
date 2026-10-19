import { Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import Loader from '../../../../components/loader/loader';
import RetryAlert from '../../../../components/retryAlert/retryAlert';
import { packForToday } from '../../../clothing/helpers/packForToday';
import { kelvinToRoundedCelsius } from '../../../weather/helpers/temperature';
import type { HourlyWeather } from '../../../weather/weather.types';
import { useChildrenQuery } from '../../hooks/useChildrenQuery';
import ChildPackingCard from '../childPackingCard/childPackingCard';
import styles from './childrenPacking.module.scss';

interface ChildrenPackingProps {
  hourly: HourlyWeather[];
}

const ChildrenPacking = ({ hourly }: ChildrenPackingProps) => {
  const { data: kids = [], isError, isPending, refetch, isFetching } = useChildrenQuery();
  const { t } = useTranslation();
  if (isPending) return <Loader />;
  if (hourly.length === 0 && !isError) return null;

  const feels = hourly.map((hour) => kelvinToRoundedCelsius(hour.feels_like));

  return (
    <>
      {hourly.length > 0 && <h2 className={styles.sectionTitle}>{t('overview.packingTitle')}</h2>}
      {isError ? (
        <RetryAlert
          message={t('overview.packingUnavailable')}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
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
