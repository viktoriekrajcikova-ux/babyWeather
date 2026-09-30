export type WeatherCondition = {
  description: string;
  icon: string;
};

export type HourlyWeather = {
  temp: number;
  feels_like: number;
  dt: number;
  weather: WeatherCondition[];
};

export type WeatherData = {
  hourly: HourlyWeather[];
  timezone: string;
};
