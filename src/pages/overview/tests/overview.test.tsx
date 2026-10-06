import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../components/toast/toastProvider';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Child } from '../../../modules/children/children.types';
import type { WeatherData } from '../../../modules/weather/weather.types';
import { AuthContext, type AuthContextValue } from '../../../modules/auth/authContext';

vi.mock('../../../modules/weather/api/weatherApiClient', () => ({
  weatherApi: { getData: vi.fn() },
}));
vi.mock('../../../modules/children/api/childrenApi', () => ({
  childrenApi: { getChildren: vi.fn(), addChild: vi.fn(), deleteChild: vi.fn() },
}));
vi.mock('../../../modules/location/api/geocodingApiClient', () => ({
  geocodingApi: { geocode: vi.fn() },
}));

vi.mock('../../../app/layout/header', () => ({ default: () => null }));

import Overview from '../overview';
import { weatherApi } from '../../../modules/weather/api/weatherApiClient';
import { childrenApi } from '../../../modules/children/api/childrenApi';

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
        <ToastProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ToastProvider>
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
    const user = userEvent.setup();
    vi.mocked(weatherApi.getData).mockRejectedValue(new Error('500'));
    vi.mocked(childrenApi.getChildren).mockResolvedValue([]);

    render(<Overview />, { wrapper: createWrapper() });

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load weather/i);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByText('Weather is currently unavailable.')).toBeVisible();
    // This suite freezes Date; give the next failure its own query timestamp.
    vi.setSystemTime(new Date('2026-01-15T00:15:01+01:00'));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load weather/i);
    vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Today')).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it.each([false, true])(
    'retries children without a false empty state (no forecast: %s)',
    async (noForecast) => {
      const user = userEvent.setup();
      vi.mocked(weatherApi.getData).mockResolvedValue(
        noForecast ? { hourly: [], timezone: 'Europe/Prague' } : makeWeather(),
      );
      vi.mocked(childrenApi.getChildren).mockRejectedValue(new Error('children failed'));
      render(<Overview />, { wrapper: createWrapper() });
      expect(await screen.findByText('Could not load children')).toBeVisible();
      expect(screen.queryByText('No children yet')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Add child' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      vi.mocked(childrenApi.getChildren).mockResolvedValue([
        row({ id: 1, name: 'Ema', age: 4, sex: 'female' }),
      ]);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument(),
      );
      if (!noForecast) expect(await screen.findByRole('heading', { name: 'Ema' })).toBeVisible();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );
});
