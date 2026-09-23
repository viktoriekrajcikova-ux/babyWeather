import { useState } from 'react';
import styles from './locationSearch.module.scss';

type LocationSearchProps = {
  onSearch: (city: string) => void;
  loading: boolean;
  error: string | null;
};

const LocationSearch = ({ onSearch, loading, error }: LocationSearchProps) => {
  const [city, setCity] = useState('');

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(city);
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
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </form>
  );
};

export default LocationSearch;
