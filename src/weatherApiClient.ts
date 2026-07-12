export type WeatherCondition = {
    description: string
    icon: string
}

export type HourlyWeather = {
    temp: number
    feels_like: number
    dt: number
    weather: WeatherCondition[]
}

export type WeatherData = {
    hourly: HourlyWeather[]
}

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

if (!apiKey) {
    throw new Error("Missing VITE_OPENWEATHER_API_KEY env var");
}

class WeatherApiClient {

    async getData(lat: number, lon: number): Promise<WeatherData> {
        const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=daily&appid=${apiKey}&lang=cz`)
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`)
        }
        return await response.json() as WeatherData
    }
}

export const weatherApi = new WeatherApiClient();
