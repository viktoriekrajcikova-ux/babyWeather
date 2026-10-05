import { useState } from 'react';
import { kelvinToCelsius } from '../../../modules/weather/helpers/temperature';
import type { WeatherData } from '../../../modules/weather/weather.types';
import { ChildrenOutfits } from './childrenOutfits';
import { WeatherPanel } from './weatherPanel';

interface HomeContentProps {
  weather: WeatherData;
}

const HomeContent = ({ weather }: HomeContentProps) => {
  const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0);
  const currentFeelsLike = Math.round(
    kelvinToCelsius(weather.hourly[selectedWeatherIndex].feels_like),
  );

  return (
    <>
      <WeatherPanel
        weather={weather}
        selectedWeatherIndex={selectedWeatherIndex}
        feelsLike={currentFeelsLike}
        onSelectForecast={setSelectedWeatherIndex}
      />
      <ChildrenOutfits feelsLike={currentFeelsLike} />
    </>
  );
};

export default HomeContent;
