import type { HourlyWeather } from '../../weatherApiClient';
import { kelvinToRoundedCelsius } from "../../model/temperature/temperature";
import styles from './overview.module.scss';
import { formatHour } from './formatHour';

type TemperatureChartProps = {
    hourly: HourlyWeather[];
};

const BAR_FLOOR = 30;

export default function TemperatureChart({ hourly, timezone }: TemperatureChartProps & { timezone: string }) {
    const chartHours = hourly;
    const chartTemps = chartHours.map(h => kelvinToRoundedCelsius(h.temp));
    const chartMin = Math.min(...chartTemps);
    const chartMax = Math.max(...chartTemps);
    const chartRange = chartMax - chartMin;
    const barHeight = (temp: number): number => {
        const ratio = chartRange === 0 ? 1 : (temp - chartMin) / chartRange;
        return Math.round(BAR_FLOOR + ratio * (100 - BAR_FLOOR));
    };
    const nowTemp = kelvinToRoundedCelsius(hourly[0].temp);
    const chartLabel =
        `Temperature for the rest of today: now ${nowTemp}°C, ` +
        `low ${chartMin}°C, high ${chartMax}°C.`;
    return (
        <>
            <h2 className={styles.sectionTitle}>Temperature outlook</h2>
            <div className={styles.card}>
                <p className={styles.chartNote}>Forecast for the rest of today.</p>
                <div className={styles.chart} role="img" aria-label={chartLabel}>
                    {chartHours.map((hour, index) => {
                        const isNow = index === 0;
                        return (
                            <div
                                key={hour.dt}
                                className={`${styles.col} ${isNow ? styles.colNow : ''}`}
                            >
                                <span className={styles.temp}>{chartTemps[index]}&deg;</span>
                                <div
                                    className={`${styles.bar} ${isNow ? styles.barNow : ''}`}
                                    style={{ height: `${barHeight(chartTemps[index])}%` }}
                                />
                                <span className={styles.hour}>{isNow ? 'Now' : formatHour(hour.dt, timezone)}</span>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.legend}>
                    <span><span className={`${styles.swatch} ${styles.swatchNow}`} />Now</span>
                    <span><span className={`${styles.swatch} ${styles.swatchForecast}`} />Forecast</span>
                </div>
            </div>
        </>
    );
}