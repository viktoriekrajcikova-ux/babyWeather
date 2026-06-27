import styles from './weatherForecast.module.scss'
import type { HourlyWeather } from '../weatherApiClient';
import { kelvinToCelsius } from '../model/temperature';

interface WeatherForecastProps {
    weatherForecastHourly: HourlyWeather[];
    onClickForecast: (index: number) => void;
}

const weatherForecast = ({ weatherForecastHourly, onClickForecast }: WeatherForecastProps) => {
    return <>
        <h2 className="text-center mt-5">12 hours ahead forecast</h2>
        <ul className={styles.list}>
            {weatherForecastHourly.map((weatherForecastHourlyItem, key) => <li key={key} onClick={() => onClickForecast(key)}>
                <div><img src={`https://openweathermap.org/img/wn/${weatherForecastHourlyItem.weather[0].icon}@2x.png`}/></div>
                {Math.round(kelvinToCelsius(weatherForecastHourlyItem.temp))} °C
                {key === 0 ? <div>Now</div> : <div>{new Date(weatherForecastHourlyItem.dt * 1000).getHours()}:00</div>}
            </li>)}
        </ul>
    </>
}

export default weatherForecast;