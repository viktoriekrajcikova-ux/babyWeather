import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Weather from '../components/weather';
import WeatherForecast from '../components/weatherForecast';

it.each([
  'clear',
  'partly-cloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'freezing-rain',
  'snow',
  'showers',
  'snow-showers',
  'thunderstorm',
  '01d',
  'unknown',
])('renders %s current and forecast icons locally with accessible descriptions', (icon) => {
  const { container } = render(
    <>
      <Weather
        temperature={20}
        feelsLike={19}
        icon={icon}
        describe="Weather description"
        onClickWeatherForecast={vi.fn()}
        forecastOpen={false}
        timeForecast={false}
      />
      <WeatherForecast
        weatherForecastHourly={[
          {
            temp: 293.15,
            feels_like: 292.15,
            dt: 1800000000,
            weather: [{ icon, description: 'Forecast description' }],
          },
        ]}
        timezone="Europe/Prague"
        onClickForecast={vi.fn()}
      />
    </>,
  );
  expect(screen.getByRole('img', { name: 'Weather description' }).tagName.toLowerCase()).toBe(
    'svg',
  );
  expect(screen.getByRole('img', { name: 'Forecast description' }).tagName.toLowerCase()).toBe(
    'svg',
  );
  expect(container.querySelector('img')).toBeNull();
});
