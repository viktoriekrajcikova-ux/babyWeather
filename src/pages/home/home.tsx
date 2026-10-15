import { Container } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../app/layout/header';
import Loader from '../../components/loader/loader';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import LocationSearch from '../../modules/location/components/locationSearch';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import { formatLocationLabel } from '../../modules/location/helpers/formatLocationLabel';
import { ChildrenOutfits } from '../../modules/children/components/childrenOutfits/childrenOutfits';
import { WeatherPanel } from '../../modules/weather/components/weatherPanel/weatherPanel';
import { kelvinToRoundedCelsius } from '../../modules/weather/helpers/temperature';
import PageHead from '../../components/pageHead/pageHead';
import RetryAlert from '../../components/retryAlert/retryAlert';

const Home = () => {
  const { t } = useTranslation();
  const { coords, setCoords } = useSelectedCoords();
  const weatherQuery = useWeatherQuery(coords);

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
      ? kelvinToRoundedCelsius(weather.hourly[selectedWeatherIndex].feels_like)
      : 0;

  const locationLabel = formatLocationLabel(coords);

  return (
    <>
      <Header />
      <Container>
        <PageHead title={t('home.title')} description={t('home.description')} />
        <LocationSearch onLocationSelect={setCoords} />
        {weatherLoading ? (
          <Loader />
        ) : weatherError || !weather ? (
          <RetryAlert
            message={t('weather.unavailable')}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
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
