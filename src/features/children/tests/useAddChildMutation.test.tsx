import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAddChildMutation } from '../hooks/useAddChildMutation';
import { useChildrenQuery } from '../hooks/useChildrenQuery';
import { useAuth } from '../../auth/hooks/useAuth';
import { childrenApi } from '../api/childrenApi';
import { ChildrenKeys } from '../childrenQueryKeys';
import type { Child } from '../child';

vi.mock('../api/childrenApi', () => ({
  childrenApi: {
    getChildren: vi.fn(),
    addChild: vi.fn(),
  },
}));

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useAddChildMutation', () => {
  it('po přidání obnoví seznam připojený až během ukládání', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: {
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
      },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getAuthGeneration: () => 0,
    });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const queryKey = ChildrenKeys.list();
    const existingChild: Child = { id: 1, name: 'Ema', age: 2, sex: 'female' };
    const addedChild: Child = { id: 2, name: 'Anna', age: 1, sex: 'female' };
    const newChild = { name: 'Anna', age: 1, sex: 'female' };
    let finishAdd!: () => void;
    const pendingAdd = new Promise<void>((resolve) => {
      finishAdd = resolve;
    });
    vi.mocked(childrenApi.addChild).mockReset().mockReturnValueOnce(pendingAdd);
    vi.mocked(childrenApi.getChildren)
      .mockReset()
      .mockResolvedValueOnce([existingChild])
      .mockResolvedValue([existingChild, addedChild]);

    const add = renderHook(() => useAddChildMutation(), { wrapper: Wrapper });
    let addOperation: Promise<void> | undefined;
    let unmountList: (() => void) | undefined;

    try {
      expect(queryClient.getQueryState(queryKey)).toBeUndefined();
      act(() => {
        addOperation = add.result.current.mutateAsync(newChild);
      });
      await waitFor(() => expect(childrenApi.addChild).toHaveBeenCalledWith(newChild));
      expect(queryClient.getQueryState(queryKey)).toBeUndefined();
      expect(childrenApi.getChildren).not.toHaveBeenCalled();

      const list = renderHook(() => useChildrenQuery(), { wrapper: Wrapper });
      unmountList = list.unmount;
      await waitFor(() => expect(list.result.current.data).toEqual([existingChild]));
      expect(childrenApi.getChildren).toHaveBeenCalledTimes(1);
      expect(queryClient.isMutating()).toBe(1);

      await act(async () => {
        finishAdd();
        await addOperation;
      });
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));

      await waitFor(() => {
        expect(list.result.current.data).toEqual([existingChild, addedChild]);
      });
      expect(childrenApi.getChildren).toHaveBeenCalledTimes(2);
      expect(queryClient.getQueryData(queryKey)).toEqual([existingChild, addedChild]);
    } finally {
      unmountList?.();
      add.unmount();
      finishAdd();
      await addOperation;
      queryClient.clear();
    }
  });
});
