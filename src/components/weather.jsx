import styles from './weather.module.scss'

const Weather = ({temperature, feelsLike, icon, describe, onClickWeatherForecast, timeForecast}) => {

    return <div className={styles.weather} onClick={onClickWeatherForecast}>
                <p className={styles.forecastTime}>{timeForecast}</p>
                <img src={icon} />
                <h1>{temperature} °C</h1>
                <div>
                    <div>Feels like {feelsLike} °C</div>
                    <div>{describe}</div>
                </div>
            </div>
}

export default Weather;