import type { HourlyWeather } from '../../weather.types';
import { kelvinToRoundedCelsius } from '../../helpers/temperature';
import { formatHour } from '../../helpers/formatHour';
import { translateWeatherDescription } from '../../helpers/translateWeatherDescription';
import { useTranslation } from 'react-i18next';
import StatTile from '../../../../components/statTile/statTile';

interface WeatherSummaryProps {
  hourly: HourlyWeather[];
  timezone: string;
}

const WeatherSummary = ({ hourly, timezone }: WeatherSummaryProps) => {
  const { t, i18n } = useTranslation();
  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => kelvinToRoundedCelsius(h.temp));
  const dayMin = Math.min(...temps);
  const dayMax = Math.max(...temps);

  const nowTemp = kelvinToRoundedCelsius(hourly[0].temp);
  const nowDescription = hourly[0].weather[0]?.description ?? '';

  const coldest = hourly.reduce(
    (coldestSoFar, hour) => (hour.temp < coldestSoFar.temp ? hour : coldestSoFar),
    hourly[0],
  );
  const feelsLikeColdest = kelvinToRoundedCelsius(coldest.feels_like);
  return (
    <>
      <StatTile
        label={t('common.now')}
        value={nowTemp}
        unit="°C"
        sub={translateWeatherDescription(nowDescription, t)}
      />
      <StatTile
        label={t('overview.today')}
        value={`${dayMin}° / ${dayMax}°`}
        sub={t('overview.lowHigh')}
      />
      <StatTile
        label={t('weather.feelsLike')}
        value={feelsLikeColdest}
        unit="°C"
        sub={t('overview.coldestAt', {
          time: formatHour(coldest.dt, timezone, i18n.resolvedLanguage),
        })}
        accent
      />
    </>
  );
};

export default WeatherSummary;
