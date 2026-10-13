import { Button, Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../../app/layout/header';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import { useChildrenQuery } from '../../modules/children/hooks/useChildrenQuery';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import styles from './overview.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import OverviewSkeleton from './components/overviewSkeleton';
import OverviewDashboard from './components/overviewDashboard';
import { useWeatherErrorToast } from '../../modules/weather/hooks/useWeatherErrorToast';

const Overview = () => {
  const { t } = useTranslation();

  const { coords } = useSelectedCoords();
  const weatherQuery = useWeatherQuery(coords);
  useWeatherErrorToast(`overview-weather:${coords.lat}:${coords.lon}`, weatherQuery);
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
    refetch,
    isFetching,
  } = weatherQuery;
  const {
    data: children,
    isPending: childrenLoading,
    isError: childrenError,
    isLoadingError,
    isSuccess: childrenSuccess,
    errorUpdatedAt,
    refetch: refetchChildren,
    isFetching: childrenFetching,
  } = useChildrenQuery();

  useEffect(() => {
    if (childrenError) {
      toast.error(
        `${isLoadingError ? t('children.loadError') : t('children.refreshError')} ${t('overview.retryHint')}`,
        { id: 'overview-children' },
      );
    } else if (childrenSuccess) {
      toast.dismiss('overview-children');
    }
  }, [childrenError, isLoadingError, childrenSuccess, errorUpdatedAt, t]);

  useEffect(() => () => toast.dismiss('overview-children'), []);

  const locationLabel = coords.name
    ? [coords.name, coords.country].filter(Boolean).join(', ')
    : `${coords.lat}, ${coords.lon}`;

  return (
    <>
      <Header />
      <Container>
        <div className={styles.pageHead}>
          <h1>{t('overview.title')}</h1>
          <p>{t('overview.description')}</p>
        </div>

        {weatherLoading || childrenLoading ? (
          <OverviewSkeleton />
        ) : weatherError || !weather ? (
          <div className={styles.alert}>
            <p>{t('weather.unavailable')}</p>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? t('common.retrying') : t('common.tryAgain')}
            </Button>
          </div>
        ) : (
          <>
            <p>{t('weather.forLocation', { location: locationLabel })}</p>
            <OverviewDashboard
              hourly={weather.hourly}
              timezone={weather.timezone}
              kids={children ?? []}
              childrenError={childrenError ? t('overview.packingUnavailable') : null}
              onRetryChildren={() => {
                void refetchChildren();
              }}
              childrenFetching={childrenFetching}
            />
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};
export default Overview;
