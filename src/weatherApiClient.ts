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

    async getData(): Promise<WeatherData> {
        const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=49.3547&lon=17.8694&exclude=daily&appid=${apiKey}&lang=cz`)
        return await response.json() as WeatherData
    }
}

export const weatherApi = new WeatherApiClient();
