import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import Header from '../../app/layout/header';
import DataAttribution from '../../features/weather/components/dataAttribution';
import { useChildrenQuery } from '../../features/children/hooks/useChildrenQuery';
import { useDeleteChildMutation } from '../../features/children/hooks/useDeleteChildMutation';
import { useWeatherQuery } from '../../features/weather/hooks/useWeatherQuery';
import { useSearchCityQuery } from '../../features/location/hooks/useSearchCityQuery';
import LocationSearch from '../../features/location/components/locationSearch';
import styles from './home.module.scss';
import { useSelectedCoords } from '../../features/location/hooks/useSelectedCoords';
import HomeContent from './homeContent';

const Home = () => {
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const { coords, setCoords } = useSelectedCoords();

  useEffect(() => {
    if (!locationQuery.data) return;

    setCoords({
      lat: locationQuery.data.lat,
      lon: locationQuery.data.lon,
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
  const { data: children, isError } = useChildrenQuery();
  const { mutate: deleteChild } = useDeleteChildMutation();

  return (
    <>
      <Header />
      <Container>
        <div className={styles.pageHead}>
          <h1>Home</h1>
          <p>Today&apos;s weather and what to dress your kids in.</p>
        </div>
        <LocationSearch onSearch={searchLocation} loading={locationLoading} error={locationError} />
        {weatherLoading ? (
          <p className={styles.status} role="status">
            Loading…
          </p>
        ) : weatherError || !weather ? (
          <div className={styles.alert} role="alert">
            Could not load weather
          </div>
        ) : (
          <HomeContent
            weather={weather}
            kids={children ?? []}
            childrenError={isError ? 'Could not load children' : null}
            onDeleteChild={deleteChild}
          />
        )}
        <DataAttribution />
      </Container>
    </>
  );
};

export default Home;
