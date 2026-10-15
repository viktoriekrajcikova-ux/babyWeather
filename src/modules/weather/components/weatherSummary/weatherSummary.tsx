import type { HourlyWeather } from '../../weather.types';
import { kelvinToRoundedCelsius } from '../../helpers/temperature';
import { formatHour } from '../../helpers/formatHour';
import { translateWeatherDescription } from '../../helpers/translateWeatherDescription';
import { useTranslation } from 'react-i18next';
import styles from './weatherSummary.module.scss';

interface WeatherSummaryProps {
  hourly: HourlyWeather[];
  timezone: string;
}

const WeatherSummary = ({ hourly, timezone }: WeatherSummaryProps) => {
  const { t, i18n } = useTranslation();
  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => kelvinToRoundedCelsius(h.temp));
  const dayMin = Math.min(...temps);
  const dayMax = Math.max(...temps);

  const nowTemp = kelvinToRoundedCelsius(hourly[0].temp);
  const nowDescription = hourly[0].weather[0]?.description ?? '';

  const coldest = hourly.reduce(
    (coldestSoFar, hour) => (hour.temp < coldestSoFar.temp ? hour : coldestSoFar),
    hourly[0],
  );
  const feelsLikeColdest = kelvinToRoundedCelsius(coldest.feels_like);
  // kazde zvlast jako komponenta?, playbook komponent
  return (
    <>
      <div className={styles.tile}>
        <span className={styles.label}>{t('common.now')}</span>
        <span className={styles.value}>
          {nowTemp}
          <span className={styles.unit}>&deg;C</span>
        </span>
        <span className={styles.sub}>{translateWeatherDescription(nowDescription, t)}</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>{t('overview.today')}</span>
        <span className={styles.value}>
          {dayMin}&deg; / {dayMax}&deg;
        </span>
        <span className={styles.sub}>{t('overview.lowHigh')}</span>
      </div>
      <div className={`${styles.tile} ${styles.accent}`}>
        <span className={styles.label}>{t('weather.feelsLike')}</span>
        <span className={styles.value}>
          {feelsLikeColdest}
          <span className={styles.unit}>&deg;C</span>
        </span>
        <span className={styles.sub}>
          {t('overview.coldestAt', {
            time: formatHour(coldest.dt, timezone, i18n.resolvedLanguage),
          })}
        </span>
      </div>
    </>
  );
};

export default WeatherSummary;
