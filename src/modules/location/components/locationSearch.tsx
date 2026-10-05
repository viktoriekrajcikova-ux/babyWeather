import { useState, useEffect } from 'react';
import styles from './locationSearch.module.scss';
import type { GeocodingResult } from '../api/geocodingApiClient';
import { useSearchCityQuery } from '../hooks/useSearchCityQuery';

type LocationSearchProps = {
  onLocationSelect: (location: GeocodingResult) => void;
};

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const [city, setCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);

  const searchLocation = (city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

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
      {locationQuery.isError && (
        <div className={styles.error} role="alert">
          Could not find that location
        </div>
      )}
    </form>
  );
};

export default LocationSearch;
