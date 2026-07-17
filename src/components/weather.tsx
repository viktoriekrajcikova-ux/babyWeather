import styles from './weather.module.scss'

interface WeatherProps {
    temperature: number;
    feelsLike: number;
    icon: string;
    describe: string;
    onClickWeatherForecast: () => void;
    forecastOpen: boolean;
    timeForecast: string | false;
}

const Weather = ({temperature, feelsLike, icon, describe, onClickWeatherForecast, forecastOpen, timeForecast}: WeatherProps) => {

    return <div className={styles.weather}>
                <p className={styles.forecastTime}>{timeForecast}</p>
                <img src={icon} alt="" />
                <h1>{temperature} °C</h1>
                <div>
                    <div>Feels like {feelsLike} °C</div>
                    <div>{describe}</div>
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
}

export default Weather;