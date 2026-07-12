export type GeocodingResult = {
    name: string
    country: string
    lat: number
    lon: number
}

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

if (!apiKey) {
    throw new Error("Missing VITE_OPENWEATHER_API_KEY env var");
}

class GeocodingApiClient {
    async geocode(city: string): Promise<GeocodingResult> {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`)
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`)
        }
        const results = await response.json() as GeocodingResult[]
        if (results.length === 0) {
            throw new Error(`Místo nenalezeno: ${city}`)
        }
        return results[0]
    }
}

export const geocodingApi = new GeocodingApiClient();