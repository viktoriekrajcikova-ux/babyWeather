import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import Child from '../../../modules/children/components/child/child';
import Weather from '../../../modules/weather/components/weather';
import WeatherForecast from '../../../modules/weather/components/weatherForecast';
import { getOutfit } from '../../../modules/clothing/clothesDeterminer';
import { kelvinToCelsius } from '../../../modules/weather/helpers/temperature';
import { formatHour } from '../../../modules/weather/helpers/formatHour';
import type { WeatherData } from '../../../modules/weather/weather.types';
import type { Child as ChildModel } from '../../../modules/children/children.types';
import styles from '../home.module.scss';

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
