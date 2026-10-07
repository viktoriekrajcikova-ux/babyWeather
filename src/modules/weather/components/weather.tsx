import styles from './weather.module.scss';
import WeatherIcon from './weatherIcon';
import { useTranslation } from 'react-i18next';
import { translateWeatherDescription } from '../helpers/translateWeatherDescription';

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
  const { t } = useTranslation();
  return (
    <div className={styles.weather}>
      <p className={styles.forecastTime}>{timeForecast}</p>
      <WeatherIcon icon={icon} description={describe} size={96} />
      <p className={styles.temp}>{temperature} °C</p>
      <div>
        <div className={styles.feels}>
          {t('weather.feelsLikeValue', { temperature: feelsLike })}
        </div>
        <div className={styles.desc}>{translateWeatherDescription(describe, t)}</div>
      </div>
      <button
        type="button"
        className={styles.forecastToggle}
        onClick={onClickWeatherForecast}
        aria-expanded={forecastOpen}
      >
        {forecastOpen ? t('weather.hideForecast') : t('weather.showForecast')}
      </button>
    </div>
  );
};

export default Weather;
