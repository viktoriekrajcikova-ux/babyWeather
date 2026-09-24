import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import Child from '../../features/children/components/child/child';
import Weather from '../../features/weather/components/weather';
import WeatherForecast from '../../features/weather/components/weatherForecast';
import { getOutfit } from '../../features/clothing/clothesDeterminer';
import { kelvinToCelsius } from '../../features/weather/helpers/temperature';
import { formatHour } from '../../features/weather/helpers/formatHour';
import type { WeatherData } from '../../features/weather/weather.types';
import type { Child as ChildModel } from '../../features/children/child';
import styles from './home.module.scss';

interface HomeContentProps {
  weather: WeatherData;
  kids: ChildModel[];
  childrenError: string | null;
  onDeleteChild: (id: number) => void;
}

const HomeContent = ({ weather, childrenError, kids, onDeleteChild }: HomeContentProps) => {
  const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0);
  const [weatherForecast, setWeatherForecast] = useState(false);

  const selectForecast = (index: number) => {
    setSelectedWeatherIndex(index);
    setWeatherForecast(false);
  };

  const currentTemp = Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].temp));
  const currentFeelsLike = Math.round(
    kelvinToCelsius(weather.hourly[selectedWeatherIndex].feels_like),
  );

  const childrenWithClothes = kids.map((child) => ({
    ...child,
    clothes: getOutfit(currentFeelsLike, child.age, child.sex),
  }));

  return (
    <>
      <Row>
        <Col xs={12}>
          {weatherForecast && (
            <WeatherForecast
              weatherForecastHourly={weather.hourly.slice(0, 13)}
              timezone={weather.timezone}
              onClickForecast={selectForecast}
            />
          )}
          <Weather
            onClickWeatherForecast={() => setWeatherForecast(!weatherForecast)}
            forecastOpen={weatherForecast}
            temperature={currentTemp}
            describe={weather.hourly[selectedWeatherIndex].weather[0].description}
            feelsLike={Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].feels_like))}
            timeForecast={
              selectedWeatherIndex > 0 &&
              `Forecast for ${formatHour(weather.hourly[selectedWeatherIndex].dt, weather.timezone)}`
            }
            icon={weather.hourly[selectedWeatherIndex].weather[0].icon}
          />
          {selectedWeatherIndex > 0 && (
            <button
              type="button"
              className="current-weather"
              onClick={() => setSelectedWeatherIndex(0)}
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back to current weather
            </button>
          )}
        </Col>
      </Row>
      {childrenError && (
        <div className={styles.alert} role="alert">
          {childrenError}
        </div>
      )}
      <Row className="g-3">
        {childrenWithClothes.map((child) => (
          <Child
            id={child.id}
            key={child.id}
            name={child.name}
            onClickDelete={onDeleteChild}
            sex={child.sex}
            allClothes={child.clothes}
          />
        ))}
      </Row>
    </>
  );
};

export default HomeContent;
