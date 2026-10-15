import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Header from '../../app/layout/header';
import DataAttribution from '../../modules/weather/components/dataAttribution/dataAttribution';
import { useChildrenQuery } from '../../modules/children/hooks/useChildrenQuery';
import { useWeatherQuery } from '../../modules/weather/hooks/useWeatherQuery';
import styles from './overview.module.scss';
import { useSelectedCoords } from '../../modules/location/hooks/useSelectedCoords';
import { formatLocationLabel } from '../../modules/location/helpers/formatLocationLabel';
import Loader from '../../components/loader/loader';
import WeatherSummary from '../../modules/weather/components/weatherSummary/weatherSummary';
import ChildrenSummary from '../../modules/children/components/childrenSummary/childrenSummary';
import ChildrenPacking from '../../modules/children/components/childrenPacking/childrenPacking';
import TemperatureChart from '../../modules/weather/components/temperatureChart/temperatureChart';
import { getTodayForecast } from '../../modules/weather/helpers/getTodayForecast';
import PageHead from '../../components/pageHead/pageHead';
import RetryAlert from '../../components/retryAlert/retryAlert';

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
  const {
    data: children,
    isPending: childrenLoading,
    isError: childrenError,
    refetch: refetchChildren,
    isFetching: childrenFetching,
  } = useChildrenQuery();

  const locationLabel = formatLocationLabel(coords);
  const today = weather ? getTodayForecast(weather.hourly, weather.timezone, new Date()) : [];

  return (
    <>
      <Header />
      <Container>
        <PageHead title={t('overview.title')} description={t('overview.description')} />

        {weatherLoading || childrenLoading ? (
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
            {today.length > 0 && (
              <>
                <section className={styles.tiles}>
                  <ChildrenSummary kids={children ?? []} isError={childrenError} />
                  <WeatherSummary hourly={today} timezone={weather.timezone} />
                </section>
                <TemperatureChart hourly={today} timezone={weather.timezone} />
              </>
            )}
            <ChildrenPacking
              hourly={today}
              kids={children ?? []}
              error={childrenError ? t('overview.packingUnavailable') : null}
              onRetry={() => {
                void refetchChildren();
              }}
              isFetching={childrenFetching}
            />
            {today.length === 0 && <p role="status">{t('overview.noForecast')}</p>}
          </>
        )}
        <DataAttribution />
      </Container>
    </>
  );
};
export default Overview;
