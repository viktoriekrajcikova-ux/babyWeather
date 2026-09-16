import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChildren } from './useChildren';
import { supabaseApi } from '../supabaseApiClient';
import type { Tables } from '../types/database';
import { useAuth } from './useAuth';
import type { Session } from '@supabase/supabase-js';

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

vi.mock('./useAuth', () => ({
        useAuth: vi.fn(),
}));

function createWrapper(
    queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
) {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
}

function createSession(userId: string): Session {
    return {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: 1893456000,
        token_type: 'bearer',
        user: {
            id: userId,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2026-01-01T00:00:00.000Z',
        },
    };
}

describe('useChildren', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({ 
            session: createSession('u'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn()
         });
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
        // delete request — server ještě neodpověděl
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

        await waitFor(() =>
            expect(result.current.children).toEqual([
                { id: 1, name: 'Ema', age: 2, sex: 'female' },
                { id: 2, name: 'Max', age: 4, sex: 'male' },
            ]),
        );
    });

    it('při chybě mazání po přepnutí účtu obnoví pouze cache původního účtu', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        const childrenA = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];
        const childrenB = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];
        let rejectDelete!: (error: Error) => void;
        const pendingDelete = new Promise<void>((_resolve, reject) => {
            rejectDelete = reject;
        });
        vi.mocked(supabaseApi.deleteChild).mockReturnValueOnce(pendingDelete);
        vi.mocked(supabaseApi.getChildren)
            .mockResolvedValueOnce([
                row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            ])
            .mockResolvedValueOnce([
                row({ id: 2, name: 'Max', age: 4, sex: 'male', user_id: 'user-B' }),
            ]);

        const { result, rerender } = renderHook(() => useChildren(), {
            wrapper: createWrapper(queryClient),
        });
        await waitFor(() => expect(result.current.children).toEqual(childrenA));

        act(() => {
            result.current.deleteChild(1);
        });
        await waitFor(() => {
            expect(supabaseApi.deleteChild).toHaveBeenCalledWith(1);
            expect(result.current.children).toEqual([]);
        });
        expect(queryClient.getQueryData(['children', 'u'])).toEqual([]);

        vi.mocked(useAuth).mockReturnValue({
            session: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });
        rerender();
        expect(result.current.children).toEqual([]);

        vi.mocked(useAuth).mockReturnValue({
            session: createSession('user-B'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });
        rerender();
        await waitFor(() => expect(result.current.children).toEqual(childrenB));

        // Chyba A přijde teprve ve chvíli, kdy B už vidí svoje děti.
        await act(async () => {
            rejectDelete(new Error('delete failed'));
            await pendingDelete.catch(() => {});
        });
        await waitFor(() => expect(queryClient.isMutating()).toBe(0));

        expect(queryClient.getQueryData(['children', 'u'])).toEqual(childrenA);
        expect(queryClient.getQueryData(['children', 'user-B'])).toEqual(childrenB);
        expect(result.current.children).toEqual(childrenB);
    });

    it('během načítání autentizace nenačítá děti', () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);
        vi.mocked(useAuth).mockReturnValue({
            session: undefined,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });

        const { result } = renderHook(() => useChildren(), { wrapper: createWrapper() });

        expect(supabaseApi.getChildren).not.toHaveBeenCalled();
        expect(result.current.children).toEqual([]);
    });

    it('bez přihlášení nenačítá děti', () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);
        vi.mocked(useAuth).mockReturnValue({ session: null, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
        renderHook(() => useChildren(), { wrapper: createWrapper() });

        expect(supabaseApi.getChildren).not.toHaveBeenCalled();

    });

    it('opožděná odpověď předchozího účtu nepřepíše děti aktuálního účtu', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        let resolveChildrenA!: (rows: Tables<'children'>[]) => void;
        const pendingChildrenA = new Promise<Tables<'children'>[]>(resolve => {
            resolveChildrenA = resolve;
        });
        const childrenB = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];

        vi.mocked(supabaseApi.getChildren)
            .mockReturnValueOnce(pendingChildrenA)
            .mockResolvedValueOnce([
                row({ id: 2, name: 'Max', age: 4, sex: 'male', user_id: 'user-B' }),
            ]);

        const { result, rerender } = renderHook(() => useChildren(), {
            wrapper: createWrapper(queryClient),
        });
        await waitFor(() => expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1));
        expect(result.current.children).toEqual([]);

        vi.mocked(useAuth).mockReturnValue({
            session: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });
        rerender();
        expect(result.current.children).toEqual([]);

        vi.mocked(useAuth).mockReturnValue({
            session: createSession('user-B'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });
        rerender();
        await waitFor(() => expect(result.current.children).toEqual(childrenB));
        expect(supabaseApi.getChildren).toHaveBeenCalledTimes(2);

        await act(async () => {
            resolveChildrenA([
                row({ id: 1, name: 'Ema', age: 2, sex: 'female', user_id: 'u' }),
            ]);
            await pendingChildrenA;
        });

        expect(queryClient.getQueryData(['children', 'user-B'])).toEqual(childrenB);
        expect(result.current.children).toEqual(childrenB);
    });

    it('při přepnutí účtu nezobrazí děti předchozího uživatele', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            }
        });

        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
        ]);
        
        const { result, rerender } = renderHook(() => useChildren(), { wrapper:createWrapper(queryClient) });

        await waitFor(() => {
           expect(result.current.children).toEqual([
                { id: 1, name: 'Ema', age: 2, sex: 'female' },
            ])
        });

        vi.mocked(useAuth).mockReturnValue({ session: null, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
        rerender();
        expect(result.current.children).toEqual([])

        let resolveChildrenB!: (rows: Tables<'children'>[]) => void;
        vi.mocked(supabaseApi.getChildren).mockReturnValue(  
            new Promise<Tables<'children'>[]>(resolve => {
            resolveChildrenB = resolve;
})); 
        vi.mocked(useAuth).mockReturnValue({ session: createSession('user-B'), signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
        rerender();
        expect(result.current.children).toEqual([])

        await act(async () => {
            resolveChildrenB([
               row({ id: 2, name: 'Max', age: 4, sex: 'male', user_id: 'user-B' })
            ]);
        });

        await waitFor(() => {
            expect(result.current.children).toEqual([
                { id: 2, name: 'Max', age: 4, sex: 'male' }
            ])
        })

    });
});