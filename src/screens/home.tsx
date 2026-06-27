import {useState} from 'react'
import {Container, Row, Col} from "react-bootstrap";
import Header from "../components/header";
import Child from "../components/child";
import Weather from "../components/weather";
import {determinator} from "../model/clothesDeterminer";
import WeatherForecast from "../components/weatherForecast";
import {useChildren} from "../hooks/useChildren";
import {useWeather} from "../hooks/useWeather";

const Home = () => {
    const {weather, loading: weatherLoading, error: weatherError} = useWeather();
    const {children, error: childrenError, deleteChild} = useChildren();
    const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0)
    const [weatherForecast, setWeatherForecast] = useState(false);

    const selectForecast = (index: number)=> {
        setSelectedWeatherIndex(index);
        setWeatherForecast(false)
    };

    if (weatherLoading) {
        return <div>Loading</div>
    }

    if (weatherError || weather === null) {
        return <div>{weatherError ?? 'Nepodařilo se načíst počasí'}</div>
    }

    const currentTemp = Math.round(weather.hourly[selectedWeatherIndex].temp - 273.15)

    const childrenWithClothes = children.map((child) => {
        const sex = child.sex as 'male' | 'female' | null;
        return {
            ...child,
            name: child.name ?? '',
            sex,
            clothes: determinator.getSuitableClothes(currentTemp, child.age, sex),
        };
    });

    return (
        <>
                        <Header />
                        <Container>
                            <Row>
                                <Col xs={12}>
                                    {weatherForecast && <WeatherForecast weatherForecastHourly={weather.hourly.slice(0, 13)} onClickForecast={selectForecast}/>}
                                    <Weather
                                        onClickWeatherForecast={() => (setWeatherForecast(!weatherForecast))}
                                        temperature={currentTemp}
                                        describe={weather.hourly[selectedWeatherIndex].weather[0].description}
                                        feelsLike={Math.round(weather.hourly[selectedWeatherIndex].feels_like - 273.15)}
                                        timeForecast={selectedWeatherIndex > 0 && `Forecast for ${ new Date(weather.hourly[selectedWeatherIndex].dt * 1000).getHours()}:00`}
                                        icon={`https://openweathermap.org/img/wn/${weather.hourly[selectedWeatherIndex].weather[0].icon}@2x.png`}/>
                                    {selectedWeatherIndex > 0 && <div className="current-weather" onClick={() => setSelectedWeatherIndex(0)}><img src="assets/img/nounBack.png"/>Back to current weather</div>}
                                </Col>
                            </Row>
                            <Row className="justify-content-between">
                                {childrenError && <Col xs={12}>{childrenError}</Col>}
                                {childrenWithClothes.map(child => (
                                    <Child id={child.id} key={child.id} name={child.name} onClickDelete={deleteChild} sex={child.sex} allClothes={child.clothes} />
                                ))}
                            </Row>
                        </Container>
        </>
    )
}
export default Home;