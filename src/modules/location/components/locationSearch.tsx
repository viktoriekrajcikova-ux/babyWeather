import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import styles from './locationSearch.module.scss';
import type { GeocodingResult } from '../api/geocodingApiClient';
import { useSearchCityQuery } from '../hooks/useSearchCityQuery';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type LocationSearchProps = {
  onLocationSelect: (location: GeocodingResult) => void;
};

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const { t } = useTranslation();

  const [city, setCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const { isError, isSuccess, errorUpdatedAt } = locationQuery;

  useEffect(() => {
    if (isError) {
      toast.error(`${t('location.searchError')} ${t('location.searchHint')}`, {
        id: 'location-search',
      });
    } else if (isSuccess) {
      toast.dismiss('location-search');
    }
  }, [isError, isSuccess, errorUpdatedAt, t]);

  useEffect(() => () => toast.dismiss('location-search'), []);

  const searchLocation = (city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;
    toast.dismiss('location-search');

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
    <Form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        searchLocation(city);
      }}
    >
      <Form.Control
        type="text"
        className={styles.input}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder={t('location.placeholder')}
        aria-label={t('location.city')}
      />
      <Button type="submit" variant="primary" disabled={locationQuery.isFetching}>
        {locationQuery.isFetching ? t('location.searching') : t('location.search')}
      </Button>
    </Form>
  );
};

export default LocationSearch;
