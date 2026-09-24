import styles from './weather.module.scss';
import WeatherIcon from './weatherIcon';

interface WeatherProps {
  temperature: number;
  feelsLike: number;
  icon: string;
  describe: string;
  onClickWeatherForecast: () => void;
  forecastOpen: boolean;
  timeForecast: string | false;
}

const Weather = ({
  temperature,
  feelsLike,
  icon,
  describe,
  onClickWeatherForecast,
  forecastOpen,
  timeForecast,
}: WeatherProps) => {
  return (
    <div className={styles.weather}>
      <p className={styles.forecastTime}>{timeForecast}</p>
      <WeatherIcon icon={icon} description={describe} size={96} />
      <p className={styles.temp}>{temperature} °C</p>
      <div>
        <div className={styles.feels}>Feels like {feelsLike} °C</div>
        <div className={styles.desc}>{describe}</div>
      </div>
      <button
        type="button"
        className={styles.forecastToggle}
        onClick={onClickWeatherForecast}
        aria-expanded={forecastOpen}
      >
        {forecastOpen ? 'Hide hourly forecast' : 'Show hourly forecast'}
      </button>
    </div>
  );
};

export default Weather;
