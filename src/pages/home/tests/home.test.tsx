import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Child } from '../../../features/children/child';
import type { WeatherData } from '../../../features/weather/weather.types';
import { AuthContext, type AuthContextValue } from '../../../features/auth/authContext';

vi.mock('../../../features/weather/api/weatherApiClient', () => ({
  weatherApi: { getData: vi.fn() },
}));
vi.mock('../../../features/children/api/childrenApi', () => ({
  childrenApi: { getChildren: vi.fn(), addChild: vi.fn(), deleteChild: vi.fn() },
}));
vi.mock('../../../features/location/api/geocodingApiClient', () => ({
  geocodingApi: { geocode: vi.fn() },
}));
// Header = auth + router
vi.mock('../../../app/layout/header', () => ({ default: () => null }));

import Home from '../home';
import { weatherApi } from '../../../features/weather/api/weatherApiClient';
import { childrenApi } from '../../../features/children/api/childrenApi';

function row(overrides: Partial<Child>): Child {
  return { id: 0, name: '', age: 0, sex: null, ...overrides };
}

// 293.15 K = 20 °C
const weatherAt20C: WeatherData = {
  timezone: 'Europe/Prague',
  hourly: [
    {
      temp: 293.15,
      feels_like: 293.15,
      dt: 0,
      weather: [{ description: 'Clear sky', icon: '01d' }],
    },
  ],
};

function createWrapper() {
  const auth: AuthContextValue = {
    session: {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'u',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    },
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getAuthGeneration: () => 0,
  };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
  return Wrapper;
}

describe('Home (integrační test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('vyrenderuje jména dětí', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(weatherAt20C);
    vi.mocked(childrenApi.getChildren).mockResolvedValue([
      row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
      row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
    ]);

    render(<Home />, { wrapper: createWrapper() });

    expect(await screen.findByText('Ema')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'GeoNames' })).toHaveAttribute(
      'href',
      'https://www.geonames.org/',
    );
  });

  it('teplota z počasí protéká přes Kelvin→°C až do rady na oblečení', async () => {
    // 278.15 K = 5 °C → zimní oblečení
    vi.mocked(weatherApi.getData).mockResolvedValue({
      timezone: 'Europe/Prague',
      hourly: [
        {
          temp: 278.15,
          feels_like: 278.15,
          dt: 0,
          weather: [{ description: 'Overcast', icon: '04d' }],
        },
      ],
    });
    vi.mocked(childrenApi.getChildren).mockResolvedValue([
      row({ id: 1, name: 'Max', age: 4, sex: 'male' }),
    ]);

    render(<Home />, { wrapper: createWrapper() });

    // při 5 °C poradí zimní bundu
    expect(await screen.findByText('winter jacket')).toBeInTheDocument();
    // rozhodně ne letní tričko
    expect(screen.queryByText('shirt')).not.toBeInTheDocument();
  });

  it('delete tlačítko má přístupný název "Remove {name}"', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(weatherAt20C);
    vi.mocked(childrenApi.getChildren).mockResolvedValue([
      row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
    ]);

    render(<Home />, { wrapper: createWrapper() });

    expect(await screen.findByRole('button', { name: 'Remove Ema' })).toBeInTheDocument();
  });

  it('při chybě načítání dětí zobrazí upozornění a ponechá počasí', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(weatherAt20C);
    vi.mocked(childrenApi.getChildren).mockRejectedValue(new Error('children request failed'));

    render(<Home />, { wrapper: createWrapper() });

    expect(await screen.findByText('Clear sky')).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load children');
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText('Clear sky')).toBeVisible();
  });

  it('při chybě počasí zobrazí chybu a nerenderuje děti', async () => {
    vi.mocked(weatherApi.getData).mockRejectedValue(new Error('500'));
    vi.mocked(childrenApi.getChildren).mockResolvedValue([
      row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
    ]);

    render(<Home />, { wrapper: createWrapper() });

    expect(await screen.findByText('Could not load weather')).toBeInTheDocument();
    expect(screen.queryByText('Ema')).not.toBeInTheDocument();
  });
});
