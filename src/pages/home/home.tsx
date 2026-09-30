import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import Header from '../../app/layout/header';
import DataAttribution from '../../modules/weather/components/dataAttribution';
import { useChildrenQuery } from '../../modules/children/hooks/useChildrenQuery';
import { useDeleteChildMutation } from '../../modules/children/hooks/useDeleteChildMutation';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import { useSearchCityQuery } from '../../modules/location/hooks/useSearchCityQuery';
import LocationSearch from '../../modules/location/components/locationSearch';
import styles from './home.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import HomeContent from './components/homeContent';

const Home = () => {
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const { coords, setCoords } = useSelectedCoords();

  useEffect(() => {
    if (!locationQuery.data) return;

    setCoords({
      lat: locationQuery.data.lat,
      lon: locationQuery.data.lon,
      name: locationQuery.data.name,
      country: locationQuery.data.country,
    });
  }, [locationQuery.data, setCoords]);

  const searchLocation = (city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

    if (trimmedCity === searchedCity) {
      void locationQuery.refetch();
      return;
    }

    setSearchedCity(trimmedCity);
  };

  const locationLoading = locationQuery.isFetching;
  const locationError = locationQuery.isError ? 'Could not find that location' : null;
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
  } = useWeatherQuery(coords);
  const { data: children, isError: childrenError } = useChildrenQuery();
  const { mutate: deleteChild, isError: deleteError } = useDeleteChildMutation();

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
        <LocationSearch onSearch={searchLocation} loading={locationLoading} error={locationError} />
        {deleteError && (
          <div className={styles.alert} role="alert">
            Could not remove child. Please try again.
          </div>
        )}
        {weatherLoading ? (
          <p className={styles.status} role="status">
            Loading…
          </p>
        ) : weatherError || !weather ? (
          <div className={styles.alert} role="alert">
            Could not load weather
          </div>
        ) : (
          <>
            <p>Weather for {locationLabel}</p>
            <HomeContent
              weather={weather}
              kids={children ?? []}
              childrenError={childrenError ? 'Could not load children' : null}
              onDeleteChild={deleteChild}
            />
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};

export default Home;
