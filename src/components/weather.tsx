import styles from './weather.module.scss'

interface WeatherProps {
    temperature: number;
    feelsLike: number;
    icon: string;
    describe: string;
    onClickWeatherForecast: () => void;
    timeForecast: string | false;
}

const Weather = ({temperature, feelsLike, icon, describe, onClickWeatherForecast, timeForecast}: WeatherProps) => {

    return <div
                className={styles.weather}
                role="button"
                tabIndex={0}
                onClick={onClickWeatherForecast}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClickWeatherForecast();
                    }
                }}
            >
                <p className={styles.forecastTime}>{timeForecast}</p>
                <img src={icon} alt="" />
                <h1>{temperature} °C</h1>
                <div>
                    <div>Feels like {feelsLike} °C</div>
                    <div>{describe}</div>
                </div>
            </div>
}

export default Weather;