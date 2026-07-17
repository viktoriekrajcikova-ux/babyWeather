import { useState } from 'react'
import { Container, Row, Col } from "react-bootstrap";
import { ArrowLeft } from 'lucide-react';
import Header from "../components/header";
import Child from "../components/child";
import Weather from "../components/weather";
import { determinator } from "../model/clothesDeterminer";
import WeatherForecast from "../components/weatherForecast";
import { useChildren } from "../hooks/useChildren";
import { useWeather } from "../hooks/useWeather";
import { kelvinToCelsius } from '../model/temperature';
import { useLocation } from '../hooks/useLocation';
import LocationSearch from "../components/locationSearch";
import type { WeatherData } from "../weatherApiClient";
import type { Child as ChildModel } from "../model/child";
import styles from "./home.module.scss";

const Home = () => {
    const { coords, searchLocation, loading: locationLoading, error: locationError } = useLocation();
    const { weather, loading: weatherLoading, error: weatherError } = useWeather(coords);
    const { children, error: childrenError, deleteChild } = useChildren();

    return (
        <>
            <Header />
            <Container>
                <div className={styles.pageHead}>
                    <h1>Home</h1>
                    <p>Today&apos;s weather and what to dress your kids in.</p>
                </div>
                <LocationSearch onSearch={searchLocation} loading={locationLoading} error={locationError} />
                {weatherLoading ? (
                    <p className={styles.status} role="status">Loading…</p>
                ) : weatherError || weather === null ? (
                    <div className={styles.alert} role="alert">{weatherError ?? 'Could not load weather'}</div>
                ) : (
                    <HomeContent
                        weather={weather}
                        kids={children}
                        childrenError={childrenError}
                        onDeleteChild={deleteChild}
                    />
                )}
            </Container>
        </>
    )
}

interface HomeContentProps {
    weather: WeatherData;
    kids: ChildModel[];
    childrenError: string | null;
    onDeleteChild: (id: number) => void;
}

const HomeContent = ({ weather, kids, childrenError, onDeleteChild }: HomeContentProps) => {
    const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0)
    const [weatherForecast, setWeatherForecast] = useState(false);

    const selectForecast = (index: number) => {
        setSelectedWeatherIndex(index);
        setWeatherForecast(false)
    };

    const currentTemp = Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].temp))

    const childrenWithClothes = kids.map((child) => ({
        ...child,
        clothes: determinator.getSuitableClothes(currentTemp, child.age, child.sex),
    }));

    return (
        <>
            <Row>
                <Col xs={12}>
                    {weatherForecast && <WeatherForecast weatherForecastHourly={weather.hourly.slice(0, 13)} onClickForecast={selectForecast}/>}
                    <Weather
                        onClickWeatherForecast={() => (setWeatherForecast(!weatherForecast))}
                        forecastOpen={weatherForecast}
                        temperature={currentTemp}
                        describe={weather.hourly[selectedWeatherIndex].weather[0].description}
                        feelsLike={Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].feels_like))}
                        timeForecast={selectedWeatherIndex > 0 && `Forecast for ${ new Date(weather.hourly[selectedWeatherIndex].dt * 1000).getHours()}:00`}
                        icon={`https://openweathermap.org/img/wn/${weather.hourly[selectedWeatherIndex].weather[0].icon}@2x.png`}/>
                    {selectedWeatherIndex > 0 && (
                        <button type="button" className="current-weather" onClick={() => setSelectedWeatherIndex(0)}>
                            <ArrowLeft size={16} strokeWidth={2} />
                            Back to current weather
                        </button>
                    )}
                </Col>
            </Row>
            {childrenError && <div className={styles.alert} role="alert">{childrenError}</div>}
            <Row className="g-3">
                {childrenWithClothes.map(child => (
                    <Child id={child.id} key={child.id} name={child.name} onClickDelete={onDeleteChild} sex={child.sex} allClothes={child.clothes} />
                ))}
            </Row>
        </>
    )
}

export default Home;
