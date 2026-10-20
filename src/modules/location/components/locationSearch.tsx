import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { selectedLocationAtom } from '../atoms/selectedLocationAtom';
import { useSearchCityQuery } from '../hooks/useSearchCityQuery';
import styles from './locationSearch.module.scss';

const LocationSearch = () => {
  const { t } = useTranslation();
  const setCoords = useSetAtom(selectedLocationAtom);
  const [city, setCity] = useState('');
  const [searchedCity, setSearchedCity] = useState('');
  const locationQuery = useSearchCityQuery(searchedCity);
  const searchLocation = (input: string) => {
    const trimmedCity = input.trim();
    if (!trimmedCity) return;

    if (trimmedCity === searchedCity) {
      void locationQuery.refetch();
      return;
    }

    setSearchedCity(trimmedCity);
  };

  useEffect(() => {
    if (!locationQuery.data) return;

    setCoords(locationQuery.data);
  }, [locationQuery.data, setCoords]);

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
