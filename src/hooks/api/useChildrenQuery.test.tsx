import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChildrenQuery } from './useChildrenQuery';
import { useDeleteChild } from './useDeleteChild';
import { supabaseApi } from '../../supabaseApiClient';
import type { Child } from '../../model/child/child';
import { useAuth } from './useAuth';
import type { Session } from '@supabase/supabase-js';

function row(overrides: Partial<Child>): Child {
    return { id: 0, name: '', age: 0, sex: null, ...overrides };
}

// mock celého klienta — jinak by import spadl
vi.mock('../../supabaseApiClient', () => ({
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

describe('useChildrenQuery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabaseApi.getChildren).mockReset();
        vi.mocked(useAuth).mockReturnValue({ 
            session: createSession('u'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getAuthGeneration: () => 0,
         });
    });

    it('načte děti', async () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            { id: 1, name: 'Ema', age: 2, sex: 'female' },
            { id: 2, name: 'Max', age: 4, sex: null },
        ]);

        const { result } = renderHook(() => useChildrenQuery(), { wrapper: createWrapper() });

        
        expect(result.current.isLoading).toBe(true);

        
        await waitFor(() => expect(result.current.isFetching).toBe(false));

        expect(result.current.data).toEqual([
            { id: 1, name: 'Ema', age: 2, sex: 'female' },
            { id: 2, name: 'Max', age: 4, sex: null },
        ]);
    });

     it('odebere dítě hned, bez čekání na server', async () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([
            row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
        ]);
        // delete request — server ještě neodpověděl
        vi.mocked(supabaseApi.deleteChild).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => ({
            children: useChildrenQuery().data,
            deleteChild: useDeleteChild().deleteChild,
        }), { wrapper: createWrapper() });
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

        const { result } = renderHook(() => ({
            children: useChildrenQuery().data,
            deleteChild: useDeleteChild().deleteChild,
        }), { wrapper: createWrapper() });
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
                row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
            ]);

        const { result, rerender } = renderHook(() => ({
            children: useChildrenQuery().data,
            deleteChild: useDeleteChild().deleteChild,
        }), { wrapper: createWrapper(queryClient) });
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
            getAuthGeneration: () => 0,
        });
        rerender();
        expect(result.current.children).toBeUndefined();

        vi.mocked(useAuth).mockReturnValue({
            session: createSession('user-B'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getAuthGeneration: () => 0,
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
            getAuthGeneration: () => 0,
        });

        const { result } = renderHook(() => useChildrenQuery(), { wrapper: createWrapper() });

        expect(supabaseApi.getChildren).not.toHaveBeenCalled();
        expect(result.current.data).toBeUndefined();
    });

    it('bez přihlášení nenačítá děti', () => {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue([]);
        vi.mocked(useAuth).mockReturnValue({ session: null, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getAuthGeneration: () => 0 });
        renderHook(() => useChildrenQuery(), { wrapper: createWrapper() });

        expect(supabaseApi.getChildren).not.toHaveBeenCalled();

    });

    it('opožděná odpověď předchozího účtu nepřepíše děti aktuálního účtu', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        let resolveChildrenA!: (rows: Child[]) => void;
        const pendingChildrenA = new Promise<Child[]>(resolve => {
            resolveChildrenA = resolve;
        });
        const childrenB = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];

        vi.mocked(supabaseApi.getChildren)
            .mockReturnValueOnce(pendingChildrenA)
            .mockResolvedValueOnce([
                row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
            ]);

        const { result, rerender } = renderHook(() => useChildrenQuery(), {
            wrapper: createWrapper(queryClient),
        });
        await waitFor(() => expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1));
        expect(result.current.data).toBeUndefined();

        vi.mocked(useAuth).mockReturnValue({
            session: null,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getAuthGeneration: () => 0,
        });
        rerender();
        expect(result.current.data).toBeUndefined();

        vi.mocked(useAuth).mockReturnValue({
            session: createSession('user-B'),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getAuthGeneration: () => 0,
        });
        rerender();
        await waitFor(() => expect(result.current.data).toEqual(childrenB));
        expect(supabaseApi.getChildren).toHaveBeenCalledTimes(2);

        await act(async () => {
            resolveChildrenA([
                row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
            ]);
            await pendingChildrenA;
        });

        expect(queryClient.getQueryData(['children', 'user-B'])).toEqual(childrenB);
        expect(result.current.data).toEqual(childrenB);
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
        
        const { result, rerender } = renderHook(() => useChildrenQuery(), { wrapper:createWrapper(queryClient) });

        await waitFor(() => {
           expect(result.current.data).toEqual([
                { id: 1, name: 'Ema', age: 2, sex: 'female' },
            ])
        });

        vi.mocked(useAuth).mockReturnValue({ session: null, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getAuthGeneration: () => 0 });
        rerender();
        expect(result.current.data).toBeUndefined();

        let resolveChildrenB!: (rows: Child[]) => void;
        vi.mocked(supabaseApi.getChildren).mockReturnValue(  
            new Promise<Child[]>(resolve => {
            resolveChildrenB = resolve;
})); 
        vi.mocked(useAuth).mockReturnValue({ session: createSession('user-B'), signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getAuthGeneration: () => 0 });
        rerender();
        expect(result.current.data).toBeUndefined();

        await act(async () => {
            resolveChildrenB([
               row({ id: 2, name: 'Max', age: 4, sex: 'male' })
            ]);
        });

        await waitFor(() => {
            expect(result.current.data).toEqual([
                { id: 2, name: 'Max', age: 4, sex: 'male' }
            ])
        })

    });
});