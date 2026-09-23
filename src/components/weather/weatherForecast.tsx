import styles from './weatherForecast.module.scss';
import WeatherIcon from './weatherIcon';
import type { HourlyWeather } from '../../weatherApiClient';
import { kelvinToCelsius } from '../../model/temperature/temperature';
import { formatHour } from '../../screens/overview/formatHour';

interface WeatherForecastProps {
  weatherForecastHourly: HourlyWeather[];
  timezone: string;
  onClickForecast: (index: number) => void;
}

const weatherForecast = ({
  weatherForecastHourly,
  timezone,
  onClickForecast,
}: WeatherForecastProps) => {
  return (
    <>
      <h2 className="text-center mt-5">12 hours ahead forecast</h2>
      <ul className={styles.list}>
        {weatherForecastHourly.map((weatherForecastHourlyItem, key) => (
          <li key={key} onClick={() => onClickForecast(key)}>
            <div>
              <WeatherIcon
                icon={weatherForecastHourlyItem.weather[0]?.icon ?? ''}
                description={weatherForecastHourlyItem.weather[0]?.description ?? ''}
              />
            </div>
            {Math.round(kelvinToCelsius(weatherForecastHourlyItem.temp))} °C
            {key === 0 ? (
              <div>Now</div>
            ) : (
              <div>{formatHour(weatherForecastHourlyItem.dt, timezone)}</div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

export default weatherForecast;
