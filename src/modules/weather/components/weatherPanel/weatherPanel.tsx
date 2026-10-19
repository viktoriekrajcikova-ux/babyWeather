import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { formatHour } from '../../helpers/formatHour';
import { kelvinToRoundedCelsius } from '../../helpers/temperature';
import type { WeatherData } from '../../weather.types';
import Weather from '../weather/weather';
import WeatherForecast from '../weatherForecast/weatherForecast';
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
  const selectedHour = weather.hourly[selectedWeatherIndex];
  const currentTemp = kelvinToRoundedCelsius(selectedHour.temp);
  const [isForecastOpen, setIsForecastOpen] = useState(false);

  const selectForecast = (index: number) => {
    onSelectForecast(index);
    setIsForecastOpen(false);
  };

  return (
    <Row>
      <Col xs={12}>
        {isForecastOpen && (
          <WeatherForecast
            weatherForecastHourly={weather.hourly.slice(0, 13)}
            timezone={weather.timezone}
            onClickForecast={selectForecast}
          />
        )}
        <Weather
          onClickWeatherForecast={() => setIsForecastOpen((open) => !open)}
          forecastOpen={isForecastOpen}
          temperature={currentTemp}
          description={selectedHour.weather[0].description}
          feelsLike={feelsLike}
          timeForecast={
            selectedWeatherIndex > 0 &&
            t('weather.forecastFor', {
              time: formatHour(selectedHour.dt, weather.timezone, i18n.resolvedLanguage),
            })
          }
          icon={selectedHour.weather[0].icon}
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
