import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Tables } from '../types/database';
import type { WeatherData } from '../weatherApiClient';

vi.mock('../weatherApiClient', () => ({
    weatherApi: { getData: vi.fn() },
}));
vi.mock('../supabaseApiClient', () => ({
    supabaseApi: { getChildren: vi.fn(), addChild: vi.fn(), deleteChild: vi.fn() },
}));
vi.mock('../geocodingApiClient', () => ({
    geocodingApi: { geocode: vi.fn() },
}));
// Header = auth + router; nechceme řešit v tomto testu
vi.mock('../components/header', () => ({ default: () => null }));

import Overview from './overview';
import { weatherApi } from '../weatherApiClient';
import { supabaseApi } from '../supabaseApiClient';

function row(overrides: Partial<Tables<'children'>>): Tables<'children'> {
    return { id: 0, name: '', age: 0, sex: null, created_at: '', user_id: 'u', ...overrides };
}

const kelvin = (celsius: number) => celsius + 273.15;
const hour = (index: number, celsius: number) => ({
    temp: kelvin(celsius),
    feels_like: kelvin(celsius - 1),
    dt: index * 3600,
    weather: [{ description: 'clouds', icon: '04d' }],
});

// den 14–16 °C: přechodné oblečení; min 14° přidá navíc tights (tempTo 15)
function makeWeather(): WeatherData {
    const hourly = Array.from({ length: 24 }, (_, i) => hour(i, 15));
    hourly[0] = hour(0, 15); // Now
    hourly[3] = hour(3, 14); // denní minimum
    hourly[9] = hour(9, 16); // denní maximum
    return { hourly };
}

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
    return Wrapper;
}

describe('Overview (integrační test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('zobrazí KPI, jména dětí a plán oblečení na celý den', async () => {
        vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 4, sex: 'female' }),
        ]);

        render(<Overview />, { wrapper: createWrapper() });

        // KPI + dítě (jméno je i v dlaždici Kids, proto cílíme na nadpis karty)
        expect(await screen.findByRole('heading', { level: 3, name: 'Ema' })).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();

        // agregace přes den: min 14° přidá tights, které při 16° nevyjdou
        expect(screen.getByText('tights')).toBeInTheDocument();
        // sjednocení podle názvu: sweater vyjde při 14° i 16°, ale jen jednou
        expect(screen.getAllByText('sweater')).toHaveLength(1);
        // rozhodně žádné letní tričko (tempFrom 20)
        expect(screen.queryByText('shirt')).not.toBeInTheDocument();
    });

    it('graf má textovou alternativu (role="img" + aria-label)', async () => {
        vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);

        render(<Overview />, { wrapper: createWrapper() });

        const chart = await screen.findByRole('img', { name: /temperature over the next 12 hours/i });
        expect(chart).toBeInTheDocument();
    });

    it('bez dětí zobrazí empty stav s odkazem na settings', async () => {
        vi.mocked(weatherApi.getData).mockResolvedValue(makeWeather());
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);

        render(<Overview />, { wrapper: createWrapper() });

        expect(await screen.findByText(/add a child and we'll show/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Add child' })).toHaveAttribute('href', '/settings');
    });

    it('při chybě počasí zobrazí alert', async () => {
        vi.mocked(weatherApi.getData).mockRejectedValue(new Error('500'));
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);

        render(<Overview />, { wrapper: createWrapper() });

        expect(await screen.findByRole('alert')).toHaveTextContent(/could not load weather/i);
    });
});
