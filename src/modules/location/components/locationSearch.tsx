import { useState, useEffect } from 'react';
import styles from './locationSearch.module.scss';
import type { GeocodingResult } from '../api/geocodingApiClient';
import { useSearchCityQuery } from '../hooks/useSearchCityQuery';
import { useToast } from '../../../components/toast/toastContext';

type LocationSearchProps = {
  onLocationSelect: (location: GeocodingResult) => void;
};

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const { showError, dismiss } = useToast();
  const [city, setCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const { isError, isSuccess, errorUpdatedAt } = locationQuery;

  useEffect(() => {
    if (isError) {
      showError({
        id: 'location-search',
        title: 'Could not find that location',
        message: 'Check the city name and your connection, then search again.',
      });
    } else if (isSuccess) {
      dismiss('location-search');
    }
  }, [isError, isSuccess, errorUpdatedAt, showError, dismiss]);

  useEffect(() => () => dismiss('location-search'), [dismiss]);

  const searchLocation = (city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;
    dismiss('location-search');

    if (trimmedCity === searchedCity) {
      void locationQuery.refetch();
      return;
    }

    setSearchedCity(trimmedCity);
  };

  useEffect(() => {
    if (!locationQuery.data) return;

    onLocationSelect(locationQuery.data);
  }, [locationQuery.data, onLocationSelect]);

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        searchLocation(city);
      }}
    >
      <input
        type="text"
        className={styles.input}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter a city"
        aria-label="City"
      />
      <button type="submit" className={styles.button} disabled={locationQuery.isFetching}>
        {locationQuery.isFetching ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
};

export default LocationSearch;
