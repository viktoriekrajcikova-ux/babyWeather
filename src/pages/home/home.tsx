import { Container } from 'react-bootstrap';
import Header from '../../app/layout/header';
import DataAttribution from '../../modules/weather/components/dataAttribution';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import LocationSearch from '../../modules/location/components/locationSearch';
import styles from './home.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import HomeContent from './components/homeContent';
import { useWeatherErrorToast } from '../../modules/weather/hooks/useWeatherErrorToast';

const Home = () => {
  const { coords, setCoords } = useSelectedCoords();
  const weatherQuery = useWeatherQuery(coords);
  useWeatherErrorToast(`home-weather:${coords.lat}:${coords.lon}`, weatherQuery);
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
    refetch,
    isFetching,
  } = weatherQuery;

  const locationLabel = coords.name
    ? [coords.name, coords.country].filter(Boolean).join(', ')
    : `${coords.lat}, ${coords.lon}`;

  return (
    <>
      <Header />
      <Container>
        <div className={styles.pageHead}>
          <h1>Home</h1>
          <p>Today&apos;s weather and what to dress your kids in.</p>
        </div>
        <LocationSearch onLocationSelect={setCoords} />
        {weatherLoading ? (
          <p className={styles.status} role="status">
            Loading…
          </p>
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
            <HomeContent weather={weather} />
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};

export default Home;
