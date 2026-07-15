import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChildren } from './useChildren';
import { supabaseApi } from '../supabaseApiClient';
import type { Tables } from '../types/database';

function row(overrides: Partial<Tables<'children'>>): Tables<'children'> {
    return { id: 0, name: '', age: 0, sex: null, created_at: '', user_id: 'u', ...overrides };
}

// mock celého klienta — jinak by import spadl
vi.mock('../supabaseApiClient', () => ({
    supabaseApi: {
        getChildren: vi.fn(),
        addChild: vi.fn(),
        deleteChild: vi.fn(),
    },
}));

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
    return Wrapper
}

describe('useChildren', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('načte děti a narovná sex na hranici', async () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            row({ id: 2, name: 'Max', age: 4, sex: 'nesmysl' }),
        ]);

        const { result } = renderHook(() => useChildren(), { wrapper: createWrapper() });

        
        expect(result.current.loading).toBe(true);

        
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.children).toEqual([
            { id: 1, name: 'Ema', age: 2, sex: 'female' },
            { id: 2, name: 'Max', age: 4, sex: null }, // 'nesmysl' → null
        ]);
    });

     it('odebere dítě hned, bez čekání na server', async () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
        ]);
        // delete request nechám "viset" — server ještě neodpověděl
        vi.mocked(supabaseApi.deleteChild).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useChildren(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.children).toHaveLength(2));

        act(() => {
            result.current.deleteChild(1);
        });

        await waitFor(() =>
            expect(result.current.children).toEqual([
                { id: 2, name: 'Max', age: 4, sex: 'male' },
            ]),
        );
    });

     it('při chybě vrátí smazané dítě zpět (rollback)', async () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
        ]);
        vi.mocked(supabaseApi.deleteChild).mockRejectedValue(new Error('fail'));

        const { result } = renderHook(() => useChildren(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.children).toHaveLength(2));

        act(() => {
            result.current.deleteChild(1);
        });

        // delete selhal → Ema je zpátky v seznamu
        await waitFor(() =>
            expect(result.current.children).toEqual([
                { id: 1, name: 'Ema', age: 2, sex: 'female' },
                { id: 2, name: 'Max', age: 4, sex: 'male' },
            ]),
        );
    });
});