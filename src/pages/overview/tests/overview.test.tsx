import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

vi.mock('../../../app/layout/header', () => ({ default: () => null }));

import Overview from '../overview';
import { weatherApi } from '../../../features/weather/api/weatherApiClient';
import { childrenApi } from '../../../features/children/api/childrenApi';

function row(overrides: Partial<Child>): Child {
  return { id: 0, name: '', age: 0, sex: null, ...overrides };
}

const kelvin = (celsius: number) => celsius + 273.15;
const forecastStart = new Date('2026-01-15T00:00:00+01:00').getTime() / 1000;
const hour = (index: number, celsius: number) => ({
  temp: kelvin(celsius),
  feels_like: kelvin(celsius - 1),
  dt: forecastStart + index * 3600,
  weather: [{ description: 'clouds', icon: '04d' }],
});

// Den 14–16 °C, pocitově 13–15 °C: přechodová bunda i mírný outfit s mikinou.
function makeWeather(): WeatherData {
  const hourly = Array.from({ length: 24 }, (_, i) => hour(i, 15));
  hourly[0] = hour(0, 15); // Now
  hourly[3] = hour(3, 14); // denní minimum
  hourly[9] = hour(9, 16); // denní maximum
  return { hourly, timezone: 'Europe/Prague' };
}

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
      <AuthContext.Provider value={auth}>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  return Wrapper;
}

describe('Overview (integrační test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Freeze Date only; React Query and DOM wait helpers keep real timers.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-15T00:15:00+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('zobrazí KPI, jména dětí a plán oblečení na zbytek dne', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
    vi.mocked(childrenApi.getChildren).mockResolvedValue([
      row({ id: 1, name: 'Ema', age: 4, sex: 'female' }),
    ]);

    render(<Overview />, { wrapper: createWrapper() });

    expect(await screen.findByRole('heading', { level: 3, name: 'Ema' })).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );

    // Pocitových 13 °C vyžaduje dvě vrstvy na nohou a přechodovou bundu.
    expect(screen.getByText('thin sweatpants')).toBeInTheDocument();
    expect(screen.getByText('insulated pants')).toBeInTheDocument();
    expect(screen.getByText('transition jacket')).toBeInTheDocument();
    // Pocitových 15 °C přidá teplé tepláky a mikinu místo bundy.
    expect(screen.getByText('warm sweatpants')).toBeInTheDocument();
    expect(screen.getByText('sweater')).toBeInTheDocument();
    // Společné kusy z obou teplot se zobrazí pouze jednou.
    expect(screen.getAllByText('long shirt')).toHaveLength(1);
    expect(screen.getAllByText('shoes')).toHaveLength(1);
    expect(screen.getAllByText('hat')).toHaveLength(1);
    expect(screen.queryByText('tights')).not.toBeInTheDocument();
    expect(screen.queryByText('socks')).not.toBeInTheDocument();
    // žádné letní tričko (tempFrom 20)
    expect(screen.queryByText('shirt')).not.toBeInTheDocument();
  });

  it('graf má textovou alternativu (role="img" + aria-label)', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
    vi.mocked(childrenApi.getChildren).mockResolvedValue([]);

    render(<Overview />, { wrapper: createWrapper() });

    const chart = await screen.findByRole('img', { name: /temperature for the rest of today/i });
    expect(chart).toBeInTheDocument();
  });

  it('bez dětí zobrazí empty stav s odkazem na settings', async () => {
    vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
    vi.mocked(childrenApi.getChildren).mockResolvedValue([]);

    render(<Overview />, { wrapper: createWrapper() });

    expect(await screen.findByText(/add a child and we'll show/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add child' })).toHaveAttribute('href', '/settings');
  });

  it('při chybě počasí zobrazí alert', async () => {
    vi.mocked(weatherApi.getData).mockRejectedValue(new Error('500'));
    vi.mocked(childrenApi.getChildren).mockResolvedValue([]);

    render(<Overview />, { wrapper: createWrapper() });

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load weather/i);
  });
});
