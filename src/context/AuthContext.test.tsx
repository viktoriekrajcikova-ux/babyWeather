import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { supabase, supabaseApi } from '../supabaseApiClient';
import { useChildrenQuery } from '../hooks/useChildrenQuery';
import { useAddChild } from '../hooks/useAddChild';
import { useDeleteChild } from '../hooks/useDeleteChild';

vi.mock('../supabaseApiClient', () => ({
  supabaseApi: {
    getChildren: vi.fn(),
    deleteChild: vi.fn(),
    addChild: vi.fn(),
  },
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { name: 'po odhlášení znovu nevytvoří odstraněnou cache dětí', signInAgain: false },
    { name: 'po opětovném přihlášení stejného účtu nepřepíše čerstvá data', signInAgain: true },
  ])('opožděný rollback $name', async ({ signInAgain }) => {
    const sessionA: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-A',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const childrenKey = ['children', 'user-A'];
    const childrenA = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];
    const freshChildrenA = [{ id: 1, name: 'Ema aktualizovaná', age: 3, sex: 'female' }];
    let rejectDelete!: (error: Error) => void;
    const pendingDelete = new Promise<void>((_resolve, reject) => {
      rejectDelete = reject;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionA },
      error: null,
    });
    vi.mocked(supabaseApi.getChildren)
      // Případný refetch nesmí okamžitou odpovědí zamaskovat chybný rollback.
      .mockReturnValue(new Promise(() => {}))
      .mockResolvedValueOnce([
        { id: 1, name: 'Ema', age: 2, sex: 'female', user_id: 'user-A', created_at: '' },
      ]);
    vi.mocked(supabaseApi.deleteChild).mockReturnValueOnce(pendingDelete);

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => ({
      auth: useAuth(),
      children: useChildrenQuery(),
      remove: useDeleteChild(),
    }), { wrapper: Wrapper });

    try {
      await waitFor(() => expect(result.current.children.data).toEqual(childrenA));
      expect(queryClient.getQueryData(childrenKey)).toEqual(childrenA);

      act(() => {
        result.current.remove.deleteChild(1);
      });
      await waitFor(() => {
        expect(supabaseApi.deleteChild).toHaveBeenCalledWith(1);
        expect(result.current.children.data).toEqual([]);
      });
      expect(queryClient.getQueryData(childrenKey)).toEqual([]);
      expect(queryClient.isMutating()).toBe(1);

      const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      await act(async () => {
        await onAuthStateChange('SIGNED_OUT', null);
      });
      await waitFor(() => expect(result.current.auth.session).toBeNull());
      expect(queryClient.getQueryState(childrenKey)).toBeUndefined();

      if (signInAgain) {
        vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce([
          { id: 1, name: 'Ema aktualizovaná', age: 3, sex: 'female', user_id: 'user-A', created_at: '' },
        ]);
        await act(async () => {
          await onAuthStateChange('SIGNED_IN', {
            ...sessionA,
            access_token: 'test-access-token-new-session',
          });
        });
        await waitFor(() => expect(result.current.children.data).toEqual(freshChildrenA));
        expect(queryClient.getQueryData(childrenKey)).toEqual(freshChildrenA);
        expect(queryClient.isMutating()).toBe(1);
      }

      await act(async () => {
        rejectDelete(new Error('delete failed'));
        await pendingDelete.catch(() => {});
      });
      
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      if (signInAgain) {
        expect(queryClient.getQueryData(childrenKey)).toEqual(freshChildrenA);
        await waitFor(() => expect(result.current.children.data).toEqual(freshChildrenA));
      } else {
        expect(queryClient.getQueryState(childrenKey)).toBeUndefined();
        expect(result.current.children.data).toBeUndefined();
      }
    } finally {
      unmount();
      queryClient.clear();
    }
  });

  it('odhlášení během cancelQueries zabrání pozdějšímu vytvoření cache v onMutate', async () => {
    const sessionA: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-A',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const childrenKey = ['children', 'user-A'];
    const childrenA = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];
    let finishCancellation!: () => void;
    const cancellationGate = new Promise<void>(resolve => {
      finishCancellation = resolve;
    });
    const realCancelQueries = queryClient.cancelQueries.bind(queryClient);
    const cancelQueries = vi.spyOn(queryClient, 'cancelQueries').mockImplementationOnce(
      async (...args) => {
        await realCancelQueries(...args);
        // Skutečné rušení zachováme, pouze řídíme okamžik pokračování onMutate.
        await cancellationGate;
      },
    );
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionA },
      error: null,
    });
    vi.mocked(supabaseApi.getChildren).mockResolvedValue([
      { id: 1, name: 'Ema', age: 2, sex: 'female', user_id: 'user-A', created_at: '' },
    ]);
    vi.mocked(supabaseApi.deleteChild).mockResolvedValueOnce(undefined);

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => ({
      auth: useAuth(),
      children: useChildrenQuery(),
      remove: useDeleteChild(),
    }), { wrapper: Wrapper });

    try {
      await waitFor(() => expect(result.current.children.data).toEqual(childrenA));
      act(() => {
        result.current.remove.deleteChild(1);
      });
      await waitFor(() => expect(cancelQueries).toHaveBeenCalledWith({ queryKey: childrenKey }));
      expect(queryClient.isMutating()).toBe(1);
      expect(supabaseApi.deleteChild).not.toHaveBeenCalled();
      expect(queryClient.getQueryData(childrenKey)).toEqual(childrenA);

      const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      await act(async () => {
        await onAuthStateChange('SIGNED_OUT', null);
      });
      await waitFor(() => expect(result.current.auth.session).toBeNull());
      expect(queryClient.getQueryState(childrenKey)).toBeUndefined();

      await act(async () => {
        finishCancellation();
        await cancellationGate;
      });
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(queryClient.getQueryState(childrenKey)).toBeUndefined();
      expect(result.current.children.data).toBeUndefined();
    } finally {
      unmount();
      finishCancellation();
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      cancelQueries.mockRestore();
      queryClient.clear();
    }
  });

  it.each([
    { name: 'bez změny přihlášení obnoví původní dotaz', nextUserId: null },
    { name: 'po přepnutí na B neinvaliduje jeho dotaz', nextUserId: 'user-B' },
    { name: 'po novém přihlášení A neinvaliduje jeho nový dotaz', nextUserId: 'user-A' },
  ])('dokončení přidávání $name', async ({ nextUserId }) => {
    const sessionA: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-A',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    const childrenA = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];
    const freshChildren = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];
    const newChild = { name: 'Anna', age: 1, sex: 'female', user_id: 'user-A' };
    let finishAdd!: () => void;
    const pendingAdd = new Promise<void>(resolve => {
      finishAdd = resolve;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionA },
      error: null,
    });
    vi.mocked(supabaseApi.getChildren)
      // Refetch zůstane čekat, aby nesmazal příznak invalidace před kontrolou.
      .mockReturnValue(new Promise(() => {}))
      .mockResolvedValueOnce([
        { ...childrenA[0], user_id: 'user-A', created_at: '' },
      ]);
    vi.mocked(supabaseApi.addChild).mockReturnValueOnce(pendingAdd);
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => ({
      auth: useAuth(),
      children: useChildrenQuery(),
      add: useAddChild(),
    }), { wrapper: Wrapper });
    let addOperation: Promise<void> | undefined;

    try {
      await waitFor(() => expect(result.current.children.data).toEqual(childrenA));
      act(() => {
        addOperation = result.current.add.addChild(newChild);
      });
      await waitFor(() => expect(supabaseApi.addChild).toHaveBeenCalledWith(newChild));
      expect(queryClient.isMutating()).toBe(1);

      if (nextUserId) {
        const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
        await act(async () => {
          await onAuthStateChange('SIGNED_OUT', null);
        });
        expect(queryClient.getQueryState(['children', 'user-A'])).toBeUndefined();
        vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce([
          { ...freshChildren[0], user_id: nextUserId, created_at: '' },
        ]);
        await act(async () => {
          await onAuthStateChange('SIGNED_IN', {
            ...sessionA,
            access_token: 'test-access-token-new-session',
            user: { ...sessionA.user, id: nextUserId },
          });
        });
        await waitFor(() => expect(result.current.children.data).toEqual(freshChildren));
      }

      const currentKey = ['children', nextUserId ?? 'user-A'];
      const callsBeforeCompletion = vi.mocked(supabaseApi.getChildren).mock.calls.length;
      expect(queryClient.getQueryState(currentKey)?.isInvalidated).toBe(false);
      await act(async () => {
        finishAdd();
        await addOperation;
      });
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(queryClient.getQueryState(currentKey)?.isInvalidated).toBe(nextUserId === null);
      expect(supabaseApi.getChildren).toHaveBeenCalledTimes(
        callsBeforeCompletion + (nextUserId === null ? 1 : 0),
      );
      expect(queryClient.getQueryData(currentKey)).toEqual(nextUserId ? freshChildren : childrenA);
      expect(result.current.children.data).toEqual(nextUserId ? freshChildren : childrenA);
      if (nextUserId === 'user-B') {
        expect(queryClient.getQueryState(['children', 'user-A'])).toBeUndefined();
      }
    } finally {
      unmount();
      finishAdd();
      await addOperation;
      queryClient.clear();
    }
  });

  it('přidávání bez původního seznamu neobnoví seznam po novém přihlášení stejného účtu', async () => {
    const sessionA: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-A',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    const queryKey = ['children', 'user-A'];
    const freshChildren = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];
    const newChild = { name: 'Anna', age: 1, sex: 'female', user_id: 'user-A' };
    let finishAdd!: () => void;
    const pendingAdd = new Promise<void>(resolve => {
      finishAdd = resolve;
    });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionA },
      error: null,
    });
    vi.mocked(supabaseApi.addChild).mockReset().mockReturnValueOnce(pendingAdd);
    vi.mocked(supabaseApi.getChildren).mockReset()
      // Nechtěný refetch nesmí stihnout skrýt příznak invalidace.
      .mockReturnValue(new Promise(() => {}))
      .mockResolvedValueOnce([
        { ...freshChildren[0], user_id: 'user-A', created_at: '' },
      ]);

    let showList = false;
    const ChildrenList = () => {
      const { data } = useChildrenQuery();
      return <div data-testid="children-list">{JSON.stringify(data)}</div>;
    };
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          {showList && <ChildrenList />}
        </AuthProvider>
      </QueryClientProvider>
    );
    const { result, rerender, unmount } = renderHook(() => ({
      auth: useAuth(),
      add: useAddChild(),
    }), { wrapper: Wrapper });
    let addOperation: Promise<void> | undefined;

    try {
      await waitFor(() => expect(result.current.auth.session?.user.id).toBe('user-A'));
      expect(queryClient.getQueryState(queryKey)).toBeUndefined();
      act(() => {
        addOperation = result.current.add.addChild(newChild);
      });
      await waitFor(() => expect(supabaseApi.addChild).toHaveBeenCalledWith(newChild));
      expect(supabaseApi.getChildren).not.toHaveBeenCalled();
      expect(queryClient.isMutating()).toBe(1);

      const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      await act(async () => {
        await onAuthStateChange('SIGNED_OUT', null);
      });
      expect(result.current.auth.session).toBeNull();
      expect(queryClient.getQueryState(queryKey)).toBeUndefined();
      await act(async () => {
        await onAuthStateChange('SIGNED_IN', {
          ...sessionA,
          access_token: 'test-access-token-new-session',
        });
      });
      expect(result.current.auth.session?.user.id).toBe('user-A');

      // Seznam vznikne až v novém přihlášení, stále ve stejném provideru.
      showList = true;
      rerender();
      await waitFor(() => {
        expect(screen.getByTestId('children-list')).toHaveTextContent(JSON.stringify(freshChildren));
      });
      expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false);
      expect(queryClient.isMutating()).toBe(1);

      await act(async () => {
        finishAdd();
        await addOperation;
      });
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));

      expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false);
      expect(queryClient.getQueryData(queryKey)).toEqual(freshChildren);
      expect(screen.getByTestId('children-list')).toHaveTextContent(JSON.stringify(freshChildren));
    } finally {
      unmount();
      finishAdd();
      await addOperation;
      queryClient.clear();
    }
  });

  it('po události odhlášení odstraní děti původního účtu z cache', async () => {
    const sessionA: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-A',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const childrenKey = ['children', 'user-A'];
    const childrenA = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: sessionA },
      error: null,
    });

    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => useAuth(), { wrapper: Wrapper });

    try {
      await waitFor(() => expect(result.current.session).toEqual(sessionA));
      queryClient.setQueryData(childrenKey, childrenA);
      expect(queryClient.getQueryData(childrenKey)).toEqual(childrenA);

      const onAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      await act(async () => {
        await onAuthStateChange('SIGNED_OUT', null);
      });

      await waitFor(() => expect(result.current.session).toBeNull());
      await waitFor(() => expect(queryClient.getQueryState(childrenKey)).toBeUndefined());
    } finally {
      unmount();
      queryClient.clear();
    }
  });
});
