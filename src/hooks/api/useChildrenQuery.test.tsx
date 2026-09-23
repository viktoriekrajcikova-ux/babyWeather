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
import { ChildrenKeys } from './childrenQueryKeys';

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
  }),
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
    vi.mocked(supabaseApi.deleteChild).mockReset();
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

    const { result } = renderHook(
      () => ({
        children: useChildrenQuery().data,
        deleteChild: useDeleteChild().deleteChild,
      }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.children).toHaveLength(2));

    act(() => {
      result.current.deleteChild(1);
    });

    await waitFor(() =>
      expect(result.current.children).toEqual([{ id: 2, name: 'Max', age: 4, sex: 'male' }]),
    );
  });

  it('při chybě vrátí smazané dítě zpět (rollback)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    const children: Child[] = [
      row({ id: 1, name: 'Ema', age: 2, sex: 'female' }),
      row({ id: 2, name: 'Max', age: 4, sex: 'male' }),
    ];

    vi.mocked(supabaseApi.getChildren)
      .mockResolvedValueOnce(children)
      .mockReturnValue(new Promise(() => {}));
    let rejectDelete!: (error: Error) => void;
    const pendingDelete = new Promise<void>((_resolve, reject) => {
      rejectDelete = reject;
    });
    vi.mocked(supabaseApi.deleteChild).mockReturnValueOnce(pendingDelete);

    const { result, unmount } = renderHook(
      () => ({
        children: useChildrenQuery().data,
        deleteChild: useDeleteChild().deleteChild,
      }),
      { wrapper: createWrapper(queryClient) },
    );

    try {
      await waitFor(() => expect(result.current.children).toEqual(children));
      act(() => {
        result.current.deleteChild(1);
      });
      await waitFor(() => {
        expect(supabaseApi.deleteChild).toHaveBeenCalledWith(1);
        expect(result.current.children).toEqual([children[1]]);
      });
      expect(queryClient.getQueryData(ChildrenKeys.list())).toEqual([children[1]]);
      expect(queryClient.isMutating()).toBe(1);

      await act(async () => {
        rejectDelete(new Error('fail'));
        await pendingDelete.catch(() => {});
      });
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(queryClient.getQueryData(ChildrenKeys.list())).toEqual(children);
      await waitFor(() => expect(result.current.children).toEqual(children));
    } finally {
      unmount();
      rejectDelete(new Error('cleanup'));
      await pendingDelete.catch(() => {});
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      queryClient.clear();
    }
  });
});
