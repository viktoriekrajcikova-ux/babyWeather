import { Container } from 'react-bootstrap';
import Header from '../../app/layout/header';
import DataAttribution from '../../features/weather/components/dataAttribution';
import { useChildrenQuery } from '../../features/children/hooks/useChildrenQuery';
import { useWeatherQuery } from '../../features/weather/hooks/useWeatherQuery';
import styles from './overview.module.scss';
import { useSelectedCoords } from '../../features/location/hooks/useSelectedCoords';
import OverviewSkeleton from './overviewSkeleton';
import OverviewContent from './overviewContent';

const Overview = () => {
  const { coords } = useSelectedCoords();
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
  } = useWeatherQuery(coords);
  const { data: children, isPending: childrenLoading, isError: childrenError } = useChildrenQuery();

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
          <div className={styles.alert} role="alert">
            Could not load weather. Check your connection and try again.
          </div>
        ) : (
          <>
            <p>Weather for {locationLabel}</p>
            <OverviewContent
              hourly={weather.hourly}
              timezone={weather.timezone}
              kids={children ?? []}
              childrenError={
                childrenError
                  ? 'Could not load children. Check your connection and try again.'
                  : null
              }
            />
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};
export default Overview;
