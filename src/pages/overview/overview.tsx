import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useToast } from '../../components/toast/toastContext';
import Header from '../../app/layout/header';
import DataAttribution from '../../modules/weather/components/dataAttribution';
import { useChildrenQuery } from '../../modules/children/hooks/useChildrenQuery';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import styles from './overview.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import OverviewSkeleton from './components/overviewSkeleton';
import OverviewContent from './components/overviewContent';
import { useWeatherErrorToast } from '../../modules/weather/hooks/useWeatherErrorToast';

const Overview = () => {
  const { t } = useTranslation();
  const { showError, dismiss } = useToast();
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
      showError({
        id: 'overview-children',
        title: isLoadingError ? t('children.loadError') : t('children.refreshError'),
        message: t('overview.retryHint'),
      });
    } else if (childrenSuccess) {
      dismiss('overview-children');
    }
  }, [childrenError, isLoadingError, childrenSuccess, errorUpdatedAt, showError, dismiss, t]);

  useEffect(() => () => dismiss('overview-children'), [dismiss]);

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
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? t('common.retrying') : t('common.tryAgain')}
            </button>
          </div>
        ) : (
          <>
            <p>{t('weather.forLocation', { location: locationLabel })}</p>
            <OverviewContent
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
