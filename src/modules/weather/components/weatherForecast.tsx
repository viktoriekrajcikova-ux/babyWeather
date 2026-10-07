import styles from './weatherForecast.module.scss';
import WeatherIcon from './weatherIcon';
import type { HourlyWeather } from '../weather.types';
import { kelvinToCelsius } from '../helpers/temperature';
import { formatHour } from '../helpers/formatHour';
import { useTranslation } from 'react-i18next';

interface WeatherForecastProps {
  weatherForecastHourly: HourlyWeather[];
  timezone: string;
  onClickForecast: (index: number) => void;
}

const WeatherForecast = ({
  weatherForecastHourly,
  timezone,
  onClickForecast,
}: WeatherForecastProps) => {
  const { t, i18n } = useTranslation();
  return (
    <>
      <h2 className="text-center mt-5">{t('weather.hourlyTitle')}</h2>
      <ul className={styles.list}>
        {weatherForecastHourly.map((weatherForecastHourlyItem, index) => (
          <li key={weatherForecastHourlyItem.dt}>
            <button type="button" onClick={() => onClickForecast(index)}>
              <WeatherIcon
                icon={weatherForecastHourlyItem.weather[0]?.icon ?? ''}
                description={weatherForecastHourlyItem.weather[0]?.description ?? ''}
              />
              {Math.round(kelvinToCelsius(weatherForecastHourlyItem.temp))} °C
              {index === 0 ? (
                <div>{t('common.now')}</div>
              ) : (
                <div>
                  {formatHour(weatherForecastHourlyItem.dt, timezone, i18n.resolvedLanguage)}
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default WeatherForecast;
