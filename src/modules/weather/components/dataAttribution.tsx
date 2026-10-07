import { Trans } from 'react-i18next';

export default function DataAttribution() {
  return (
    <p className="text-center my-3">
      <Trans
        i18nKey="weather.attribution"
        components={{
          weatherLink: <a href="https://open-meteo.com/">Open-Meteo</a>,
          locationLink: <a href="https://www.geonames.org/">GeoNames</a>,
        }}
      />
    </p>
  );
}
