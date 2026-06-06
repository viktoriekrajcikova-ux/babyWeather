import React, {useState} from 'react'
import {Container, Row, Col} from "react-bootstrap";
import Header from "../components/header.jsx";
import Child from "../components/child.jsx";
import Weather from "../components/weather.jsx";
import {determinator} from "../model/clothesDeterminer";
import WeatherForecast from "../components/weatherForecast.jsx";
import {useChildren} from "../hooks/useChildren";
import {useWeather} from "../hooks/useWeather";


const Home = () => {
    const {weather, loading: weatherLoading, error: weatherError} = useWeather();
    const {children, error: childrenError, deleteChild} = useChildren();
    const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0)
    const [weatherForecast, setWeatherForecast] = useState(false);

    const selectForecast = (index) => {
        setSelectedWeatherIndex(index);
        setWeatherForecast(false)
    };

    if (weatherLoading) {
        return <div>Loading</div>
    }

    if (weatherError || weather === null) {
        return <div>{weatherError ?? 'Nepodařilo se načíst počasí'}</div>
    }

    return (
        <>
                        <Header />
                        <Container>
                            <Row>
                                <Col xs={12}>
                                    {weatherForecast && <WeatherForecast weatherForecastHourly={weather.hourly.slice(0, 13)} onClickForecast={selectForecast}/>}
                                    <Weather
                                        onClickWeatherForecast={() => (setWeatherForecast(!weatherForecast))}
                                        temperature={Math.round(weather.hourly[selectedWeatherIndex].temp - 273.15)}
                                        describe={weather.hourly[selectedWeatherIndex].weather[0].description}
                                        feelsLike={Math.round(weather.hourly[selectedWeatherIndex].feels_like - 273.15)}
                                        timeForecast={selectedWeatherIndex > 0 && `Forecast for ${ new Date(weather.hourly[selectedWeatherIndex].dt * 1000).getHours()}:00`}
                                        icon={`https://openweathermap.org/img/wn/${weather.hourly[selectedWeatherIndex].weather[0].icon}@2x.png`}/>
                                    {selectedWeatherIndex > 0 && <div className="current-weather" onClick={() => setSelectedWeatherIndex(0)}><img src="assets/img/nounBack.png"/>Back to current weather</div>}
                                </Col>
                            </Row>
                            <Row className="justify-content-between">
                                {childrenError && <Col xs={12}>{childrenError}</Col>}
                                {children.map((child, key) => {
                                    const clothes = determinator.getSuitableClothes(
                                        Math.round(weather.hourly[selectedWeatherIndex].temp - 273.15),
                                        child.age,
                                        child.sex
                                    )
                                    return <Child id={child.id} key={key} name={child.name} onClickDelete={deleteChild} sex={child.sex} allClothes={clothes} />;
                                })}
                            </Row>
                        </Container>
        </>
    )
}
export default Home;