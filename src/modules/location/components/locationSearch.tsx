import { useState, useEffect } from 'react';
import styles from './locationSearch.module.scss';
import type { GeocodingResult } from '../api/geocodingApiClient';
import { useSearchCityQuery } from '../hooks/useSearchCityQuery';
import { useToast } from '../../../components/toast/toastContext';
import { useTranslation } from 'react-i18next';

type LocationSearchProps = {
  onLocationSelect: (location: GeocodingResult) => void;
};

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const { t } = useTranslation();
  const { showError, dismiss } = useToast();
  const [city, setCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const { isError, isSuccess, errorUpdatedAt } = locationQuery;

  useEffect(() => {
    if (isError) {
      showError({
        id: 'location-search',
        title: t('location.searchError'),
        message: t('location.searchHint'),
      });
    } else if (isSuccess) {
      dismiss('location-search');
    }
  }, [isError, isSuccess, errorUpdatedAt, showError, dismiss, t]);

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
        placeholder={t('location.placeholder')}
        aria-label={t('location.city')}
      />
      <button type="submit" className={styles.button} disabled={locationQuery.isFetching}>
        {locationQuery.isFetching ? t('location.searching') : t('location.search')}
      </button>
    </form>
  );
};

export default LocationSearch;
