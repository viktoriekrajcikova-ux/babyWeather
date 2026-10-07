import type { HourlyWeather } from '../../../modules/weather/weather.types';
import { kelvinToRoundedCelsius } from '../../../modules/weather/helpers/temperature';
import styles from '../overview.module.scss';
import { formatHour } from '../../../modules/weather/helpers/formatHour';
import { useTranslation } from 'react-i18next';

type TemperatureChartProps = {
  hourly: HourlyWeather[];
};

const BAR_FLOOR = 30;

export default function TemperatureChart({
  hourly,
  timezone,
}: TemperatureChartProps & { timezone: string }) {
  const { t, i18n } = useTranslation();
  const chartHours = hourly;
  const chartTemps = chartHours.map((h) => kelvinToRoundedCelsius(h.temp));
  const chartMin = Math.min(...chartTemps);
  const chartMax = Math.max(...chartTemps);
  const chartRange = chartMax - chartMin;
  const barHeight = (temp: number): number => {
    const ratio = chartRange === 0 ? 1 : (temp - chartMin) / chartRange;
    return Math.round(BAR_FLOOR + ratio * (100 - BAR_FLOOR));
  };
  const nowTemp = kelvinToRoundedCelsius(hourly[0].temp);
  const chartLabel = t('overview.chartLabel', { now: nowTemp, low: chartMin, high: chartMax });
  return (
    <>
      <h2 className={styles.sectionTitle}>{t('overview.chartTitle')}</h2>
      <div className={styles.card}>
        <p className={styles.chartNote}>{t('overview.chartNote')}</p>
        <div className={styles.chart} role="img" aria-label={chartLabel}>
          {chartHours.map((hour, index) => {
            const isNow = index === 0;
            return (
              <div key={hour.dt} className={`${styles.col} ${isNow ? styles.colNow : ''}`}>
                <span className={styles.temp}>{chartTemps[index]}&deg;</span>
                <div
                  className={`${styles.bar} ${isNow ? styles.barNow : ''}`}
                  style={{ height: `${barHeight(chartTemps[index])}%` }}
                />
                <span className={styles.hour}>
                  {isNow ? t('common.now') : formatHour(hour.dt, timezone, i18n.resolvedLanguage)}
                </span>
              </div>
            );
          })}
        </div>
        <div className={styles.legend}>
          <span>
            <span className={`${styles.swatch} ${styles.swatchNow}`} />
            {t('common.now')}
          </span>
          <span>
            <span className={`${styles.swatch} ${styles.swatchForecast}`} />
            {t('overview.forecast')}
          </span>
        </div>
      </div>
    </>
  );
}
