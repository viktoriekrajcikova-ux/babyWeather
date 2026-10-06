import { Link } from 'react-router-dom';
import { Baby } from 'lucide-react';
import { packForToday } from '../../../modules/clothing/helpers/packForToday';
import { kelvinToRoundedCelsius } from '../../../modules/weather/helpers/temperature';
import type { HourlyWeather } from '../../../modules/weather/weather.types';
import type { Child } from '../../../modules/children/children.types';
import { formatHour } from '../../../modules/weather/helpers/formatHour';
import { getTodayForecast } from '../../../modules/weather/helpers/getTodayForecast';
import TemperatureChart from './temperatureChart';
import ChildPackingCard from './childPackingCard';
import styles from '../overview.module.scss';
import { formatNames } from '../helpers/formatNames';

interface OverviewContentProps {
  hourly: HourlyWeather[];
  timezone: string;
  kids: Child[];
  childrenError: string | null;
  onRetryChildren: () => void;
  childrenFetching: boolean;
}

const OverviewContent = ({
  hourly,
  timezone,
  kids,
  childrenError,
  onRetryChildren,
  childrenFetching,
}: OverviewContentProps) => {
  const today = getTodayForecast(hourly, timezone, new Date());
  const childrenStatus = childrenError ? (
    <div className={styles.alert}>
      <p>{childrenError}</p>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={onRetryChildren}
        disabled={childrenFetching}
      >
        {childrenFetching ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  ) : null;
  if (today.length === 0) {
    return (
      <>
        {childrenStatus}
        <p role="status">No forecast available for the rest of today.</p>
      </>
    );
  }

  const temps = today.map((h) => kelvinToRoundedCelsius(h.temp));
  const dayMin = Math.min(...temps);
  const dayMax = Math.max(...temps);

  // oblečení plánuju podle pocitové teploty
  const feels = today.map((h) => kelvinToRoundedCelsius(h.feels_like));

  const nowTemp = kelvinToRoundedCelsius(today[0].temp);
  const nowDescription = today[0].weather[0]?.description ?? '';

  const coldest = today.reduce(
    (coldestSoFar, hour) => (hour.temp < coldestSoFar.temp ? hour : coldestSoFar),
    today[0],
  );
  const feelsLikeColdest = kelvinToRoundedCelsius(coldest.feels_like);

  return (
    <>
      <section className={styles.tiles}>
        <div className={styles.tile}>
          <span className={styles.label}>Kids</span>
          <span className={styles.value}>{childrenError ? '-' : kids.length}</span>
          <span className={styles.sub}>
            {childrenError ? 'Unavailable' : formatNames(kids) || 'No children yet'}
          </span>
        </div>
        <div className={styles.tile}>
          <span className={styles.label}>Now</span>
          <span className={styles.value}>
            {nowTemp}
            <span className={styles.unit}>&deg;C</span>
          </span>
          <span className={styles.sub}>{nowDescription}</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.label}>Today</span>
          <span className={styles.value}>
            {dayMin}&deg; / {dayMax}&deg;
          </span>
          <span className={styles.sub}>Low / high</span>
        </div>
        <div className={`${styles.tile} ${styles.accent}`}>
          <span className={styles.label}>Feels like</span>
          <span className={styles.value}>
            {feelsLikeColdest}
            <span className={styles.unit}>&deg;C</span>
          </span>
          <span className={styles.sub}>Coldest at {formatHour(coldest.dt, timezone)}</span>
        </div>
      </section>

      <TemperatureChart hourly={today} timezone={timezone} />

      <h2 className={styles.sectionTitle}>What to pack today</h2>
      {childrenError ? (
        childrenStatus
      ) : kids.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <Baby className={styles.emptyIcon} size={40} strokeWidth={2} aria-hidden="true" />
          <p>Add a child and we&apos;ll show today&apos;s dressing plan here.</p>
          <Link to="/settings" className={styles.button}>
            Add child
          </Link>
        </div>
      ) : (
        <div className={styles.plan}>
          {kids.map((child) => {
            const clothes = packForToday(child, feels);
            return <ChildPackingCard key={child.id} child={child} clothes={clothes} />;
          })}
        </div>
      )}
    </>
  );
};

export default OverviewContent;
