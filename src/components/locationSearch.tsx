import { useState } from 'react'

type LocationSearchProps = {
    onSearch: (city: string) => void
    loading: boolean
    error: string | null
}

const LocationSearch = ({ onSearch, loading, error }: LocationSearchProps) => {
    const [city, setCity] = useState('');

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSearch(city); }}>
            <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Zadej město"
                aria-label="Město"
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Hledám…' : 'Najít'}
            </button>
            {error && <div role="alert">{error}</div>}
        </form>
    );
}

export default LocationSearch;