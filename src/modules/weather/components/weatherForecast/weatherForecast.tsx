import { useTranslation } from 'react-i18next';

import { formatHour } from '../../helpers/formatHour';
import { kelvinToRoundedCelsius } from '../../helpers/temperature';
import type { HourlyWeather } from '../../weather.types';
import WeatherIcon from '../weatherIcon/weatherIcon';
import styles from './weatherForecast.module.scss';

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
        {weatherForecastHourly.map((hour, index) => (
          <li key={hour.dt}>
            <button type="button" onClick={() => onClickForecast(index)}>
              <WeatherIcon
                icon={hour.weather[0]?.icon ?? ''}
                description={hour.weather[0]?.description ?? ''}
              />
              {kelvinToRoundedCelsius(hour.temp)} °C
              <div>
                {index === 0
                  ? t('common.now')
                  : formatHour(hour.dt, timezone, i18n.resolvedLanguage)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default WeatherForecast;
