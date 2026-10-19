import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import Header from '../../app/layout/header';
import Loader from '../../components/loader/loader';
import PageHead from '../../components/pageHead/pageHead';
import RetryAlert from '../../components/retryAlert/retryAlert';
import ChildrenPacking from '../../modules/children/components/childrenPacking/childrenPacking';
import ChildrenSummary from '../../modules/children/components/childrenSummary/childrenSummary';
import { formatLocationLabel } from '../../modules/location/helpers/formatLocationLabel';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import TemperatureChart from '../../modules/weather/components/temperatureChart/temperatureChart';
import WeatherSummary from '../../modules/weather/components/weatherSummary/weatherSummary';
import { getTodayForecast } from '../../modules/weather/helpers/getTodayForecast';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import styles from './overview.module.scss';

const Overview = () => {
  const { t } = useTranslation();
  const { coords } = useSelectedCoords();
  const weatherQuery = useWeatherQuery(coords);
  const {
    data: weather,
    isPending: weatherLoading,
    isError: weatherError,
    refetch,
    isFetching,
  } = weatherQuery;

  const locationLabel = formatLocationLabel(coords);
  // getTodayForecast urcujue dnesni datum v casovem pasmu mesta, vyrazuje skoncene hodiny
  const todayForecast = getTodayForecast(weather, new Date());

  return (
    <>
      <Header />
      <Container>
        <PageHead title={t('overview.title')} description={t('overview.description')} />

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
            {todayForecast.length > 0 && (
              <>
                <section className={styles.tiles}>
                  <ChildrenSummary />
                  <WeatherSummary hourly={todayForecast} timezone={weather.timezone} />
                </section>
                <TemperatureChart hourly={todayForecast} timezone={weather.timezone} />
              </>
            )}
            <ChildrenPacking hourly={todayForecast} />
            {todayForecast.length === 0 && <p role="status">{t('overview.noForecast')}</p>}
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};
export default Overview;
