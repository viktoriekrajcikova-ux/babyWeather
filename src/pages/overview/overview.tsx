import { Container } from 'react-bootstrap';
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
        title: isLoadingError ? 'Could not load children' : 'Could not refresh children',
        message: 'Use Try again in the packing section to retry.',
      });
    } else if (childrenSuccess) {
      dismiss('overview-children');
    }
  }, [childrenError, isLoadingError, childrenSuccess, errorUpdatedAt, showError, dismiss]);

  useEffect(() => () => dismiss('overview-children'), [dismiss]);

  const locationLabel = coords.name
    ? [coords.name, coords.country].filter(Boolean).join(', ')
    : `${coords.lat}, ${coords.lon}`;

  return (
    <>
      <Header />
      <Container>
        <div className={styles.pageHead}>
          <h1>Overview</h1>
          <p>Everything for today, at a glance.</p>
        </div>

        {weatherLoading || childrenLoading ? (
          <OverviewSkeleton />
        ) : weatherError || !weather ? (
          <div className={styles.alert}>
            <p>Weather is currently unavailable.</p>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : (
          <>
            <p>Weather for {locationLabel}</p>
            <OverviewContent
              hourly={weather.hourly}
              timezone={weather.timezone}
              kids={children ?? []}
              childrenError={
                childrenError ? 'The children’s packing plan is currently unavailable.' : null
              }
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
