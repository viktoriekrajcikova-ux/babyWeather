import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import Header from '../../app/layout/header';
import Loader from '../../components/loader/loader';
import PageHead from '../../components/pageHead/pageHead';
import RetryAlert from '../../components/retryAlert/retryAlert';
import { ChildrenOutfits } from '../../modules/children/components/childrenOutfits/childrenOutfits';
import LocationSearch from '../../modules/location/components/locationSearch';
import { formatLocationLabel } from '../../modules/location/helpers/formatLocationLabel';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import { WeatherPanel } from '../../modules/weather/components/weatherPanel/weatherPanel';
import { kelvinToRoundedCelsius } from '../../modules/weather/helpers/temperature';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';

const Home = () => {
  const { t } = useTranslation();
  const { coords, setCoords } = useSelectedCoords(); // Local search najde mesto, pak zavola setCoords, tim se zmeni Coords v Home a nacre se pocasi pro mesto
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
            <p>{t('weather.forLocation', { location: formatLocationLabel(coords) })}</p>
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
