import { Button, Container } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../app/layout/header';
import Loader from '../../components/loader/loader';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import LocationSearch from '../../modules/location/components/locationSearch';
import styles from './home.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import { ChildrenOutfits } from '../../modules/children/components/childrenOutfits/childrenOutfits';
import { WeatherPanel } from '../../modules/weather/components/weatherPanel/weatherPanel';
import { kelvinToCelsius } from '../../modules/weather/helpers/temperature';
import { useWeatherErrorToast } from '../../modules/weather/hooks/useWeatherErrorToast';

const Home = () => {
  const { t } = useTranslation();
  const { coords, setCoords } = useSelectedCoords();
  const weatherQuery = useWeatherQuery(coords);
  useWeatherErrorToast(`home-weather:${coords.lat}:${coords.lon}`, weatherQuery);
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
    refetch,
    isFetching,
  } = weatherQuery;

  const [selectedWeatherIndex, setSelectedWeatherIndex] = useState(0);
  const showWeather = !weatherLoading && !weatherError && Boolean(weather);

  useEffect(() => {
    if (!showWeather) setSelectedWeatherIndex(0);
  }, [showWeather]);

  const currentFeelsLike =
    showWeather && weather
      ? Math.round(kelvinToCelsius(weather.hourly[selectedWeatherIndex].feels_like))
      : 0;

  const locationLabel = coords.name
    ? [coords.name, coords.country].filter(Boolean).join(', ')
    : `${coords.lat}, ${coords.lon}`;

  return (
    <>
      <Header />
      <Container>
        <div className={styles.pageHead}>
          <h1>{t('home.title')}</h1>
          <p>{t('home.description')}</p>
        </div>
        <LocationSearch onLocationSelect={setCoords} />
        {weatherLoading ? (
          <Loader />
        ) : weatherError || !weather ? (
          <div className={styles.alert}>
            <p>{t('weather.unavailable')}</p>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? t('common.retrying') : t('common.tryAgain')}
            </Button>
          </div>
        ) : (
          <>
            <p>{t('weather.forLocation', { location: locationLabel })}</p>
            <WeatherPanel
              weather={weather}
              selectedWeatherIndex={selectedWeatherIndex}
              feelsLike={currentFeelsLike}
              onSelectForecast={setSelectedWeatherIndex}
            />
            <ChildrenOutfits feelsLike={currentFeelsLike} />
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};

export default Home;
