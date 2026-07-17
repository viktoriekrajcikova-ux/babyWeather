import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
// Header = auth + router
vi.mock('../components/header', () => ({ default: () => null }));

import Home from './home';
import { weatherApi } from '../weatherApiClient';
import { supabaseApi } from '../supabaseApiClient';

function row(overrides: Partial<Tables<'children'>>): Tables<'children'> {
    return { id: 0, name: '', age: 0, sex: null, created_at: '', user_id: 'u', ...overrides };
}

// 293.15 K = 20 °C
const weatherAt20C: WeatherData = {
    hourly: [
        { temp: 293.15, feels_like: 293.15, dt: 0, weather: [{ description: 'jasno', icon: '01d' }] },
    ],
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
}

describe('Home (integrační test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('vyrenderuje jména dětí', async () => {
        vi.mocked(weatherApi.getData).mockResolvedValue(weatherAt20C);
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
        ]);

        render(<Home />, { wrapper: createWrapper() });

        expect(await screen.findByText('Ema')).toBeInTheDocument();
        expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('teplota z počasí protéká přes Kelvin→°C až do rady na oblečení', async () => {
        // 278.15 K = 5 °C → zimní oblečení
        vi.mocked(weatherApi.getData).mockResolvedValue({
            hourly: [
                { temp: 278.15, feels_like: 278.15, dt: 0, weather: [{ description: 'zataženo', icon: '04d' }] },
            ],
        });
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Max', age: 4, sex: 'male' }),
        ]);

        render(<Home />, { wrapper: createWrapper() });

        // při 5 °C poradí zimní bundu
        expect(await screen.findByText('winter jacket')).toBeInTheDocument();
        // rozhodně ne letní tričko
        expect(screen.queryByText('shirt')).not.toBeInTheDocument();
    });

        it('při chybě počasí zobrazí chybu a nerenderuje děti', async () => {
        vi.mocked(weatherApi.getData).mockRejectedValue(new Error('500'));
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
        ]);

        render(<Home />, { wrapper: createWrapper() });

        expect(await screen.findByText('Nepodařilo se načíst počasí')).toBeInTheDocument();
        expect(screen.queryByText('Ema')).not.toBeInTheDocument();
    });
});