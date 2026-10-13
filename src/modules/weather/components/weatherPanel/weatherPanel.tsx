import { Button, Row, Col } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import type { WeatherData } from '../../weather.types';
import { kelvinToCelsius } from '../../helpers/temperature';
import WeatherForecast from '../weatherForecast/weatherForecast';
import Weather from '../weather/weather';
import { formatHour } from '../../helpers/formatHour';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './weatherPanel.module.scss';

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
  const { t, i18n } = useTranslation();
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
            t('weather.forecastFor', {
              time: formatHour(
                weather.hourly[selectedWeatherIndex].dt,
                weather.timezone,
                i18n.resolvedLanguage,
              ),
            })
          }
          icon={weather.hourly[selectedWeatherIndex].weather[0].icon}
        />
        {selectedWeatherIndex > 0 && (
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className={styles.currentWeather}
            onClick={() => onSelectForecast(0)}
          >
            <ArrowLeft size={16} strokeWidth={2} />
            {t('weather.backToCurrent')}
          </Button>
        )}
      </Col>
    </Row>
  );
};
