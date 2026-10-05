import { Row, Col } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import type { WeatherData } from '../../../modules/weather/weather.types';
import { kelvinToCelsius } from '../../../modules/weather/helpers/temperature';
import WeatherForecast from '../../../modules/weather/components/weatherForecast';
import Weather from '../../../modules/weather/components/weather';
import { formatHour } from '../../../modules/weather/helpers/formatHour';
import { useState } from 'react';

interface WeatherPanelProps {
  weather: WeatherData;
  selectedWeatherIndex: number;
  feelsLike: number;
  onSelectForecast: (index: number) => void;
}

export const WeatherPanel = ({
  weather,
  selectedWeatherIndex,
  feelsLike,
  onSelectForecast,
}: WeatherPanelProps) => {
  const currentTemp = Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].temp));
  const [weatherForecast, setWeatherForecast] = useState(false);

  const selectForecast = (index: number) => {
    onSelectForecast(index);
    setWeatherForecast(false);
  };

  return (
    <Row>
      <Col xs={12}>
        {weatherForecast && (
          <WeatherForecast
            weatherForecastHourly={weather.hourly.slice(0, 13)}
            timezone={weather.timezone}
            onClickForecast={selectForecast}
          />
        )}
        <Weather
          onClickWeatherForecast={() => setWeatherForecast((open) => !open)}
          forecastOpen={weatherForecast}
          temperature={currentTemp}
          describe={weather.hourly[selectedWeatherIndex].weather[0].description}
          feelsLike={feelsLike}
          timeForecast={
            selectedWeatherIndex > 0 &&
            `Forecast for ${formatHour(weather.hourly[selectedWeatherIndex].dt, weather.timezone)}`
          }
          icon={weather.hourly[selectedWeatherIndex].weather[0].icon}
        />
        {selectedWeatherIndex > 0 && (
          <button type="button" className="current-weather" onClick={() => onSelectForecast(0)}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to current weather
          </button>
        )}
      </Col>
    </Row>
  );
};
