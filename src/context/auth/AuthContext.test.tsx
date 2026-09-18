import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../../hooks/api/useAuth';
import { supabase, supabaseApi } from '../../supabaseApiClient';
import { useChildrenQuery } from '../../hooks/api/useChildrenQuery';
import { useAddChild } from '../../hooks/api/useAddChild';
import { useDeleteChild } from '../../hooks/api/useDeleteChild';
import { ChildrenKeys } from '../../hooks/api/childrenQueryKeys';
import ProtectedRoute from '../../components/route/protectedRoute';
import type { Child } from '../../model/child/child';

vi.mock('../../supabaseApiClient', () => ({
  supabaseApi: { getChildren: vi.fn(), deleteChild: vi.fn(), addChild: vi.fn() },
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function sessionFor(id: string): Session {
  return {
    access_token: `token-${id}`, refresh_token: 'refresh', expires_in: 3600,
    token_type: 'bearer',
    user: { id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00.000Z' },
  };
}

const sessionA = sessionFor('user-A');
const sessionB = sessionFor('user-B');
const childrenA: Child[] = [{ id: 1, name: 'Ema', age: 2, sex: 'female' }];
const childrenB: Child[] = [{ id: 2, name: 'Max', age: 4, sex: 'male' }];
const freshChildrenA: Child[] = [{ id: 1, name: 'Ema aktualizovaná', age: 3, sex: 'female' }];
const newChild = { name: 'Anna', age: 1, sex: 'female', user_id: 'user-A' };
const key = ChildrenKeys.list();
const clients: QueryClient[] = [];

function ChildrenList() {
  const { data } = useChildrenQuery();
  return <div data-testid="children-list">{JSON.stringify(data) ?? 'čeká'}</div>;
}


function AuthProbe() {
  const { session, getAuthGeneration } = useAuth();
  return <div data-testid="auth">{JSON.stringify({
    id: session === undefined ? 'čeká' : session?.user.id ?? null,
    token: session?.access_token, generation: getAuthGeneration(),
  })}</div>;
}

function PrivateScreen({ showList, onAdd }: { showList: boolean; onAdd: (operation: Promise<void>) => void }) {
  const { addChild } = useAddChild();
  const { deleteChild } = useDeleteChild();
  return <div data-testid="private-content">
    <button onClick={() => onAdd(addChild(newChild))}>Přidat</button>
    <button onClick={() => deleteChild(1)}>Smazat</button>
    {showList && <ChildrenList />}
  </div>;
}

function setup({ showList = true, strict = false } = {}) {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, staleTime: Infinity }, mutations: { retry: false },
  } });
  clients.push(client);
  let addOperation: Promise<void> | undefined;
  const onAdd = (operation: Promise<void>) => { addOperation = operation; };
  const tree = (list: boolean) => {
    const content = <QueryClientProvider client={client}>
      <AuthProvider>
        <AuthProbe />
        {/* Bez Routes zůstane hranice přítomná i po Navigate na /login. */}
        <MemoryRouter>
          <ProtectedRoute><PrivateScreen showList={list} onAdd={onAdd} /></ProtectedRoute>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>;
    return strict ? <StrictMode>{content}</StrictMode> : content;
  };
  const view = render(tree(showList));
  return { client, ...view, showList: () => view.rerender(tree(true)), finishAdd: () => addOperation };
}

function auth() {
  return JSON.parse(screen.getByTestId('auth').textContent!) as { id: string | null; token?: string; generation: number };
}

async function emit(event: AuthChangeEvent, session: Session | null, subscription = 0) {
  const callback = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[subscription][0];
  await act(async () => { await callback(event, session); });
}

function expectList(children: Child[]) {
  expect(screen.getByTestId('children-list').textContent).toBe(JSON.stringify(children));
}

describe('AuthProvider se sdílenou cache dětí', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockReset().mockResolvedValue({ data: { session: sessionA }, error: null });
    vi.mocked(supabaseApi.getChildren).mockReset().mockResolvedValue(childrenA);
    vi.mocked(supabaseApi.addChild).mockReset();
    vi.mocked(supabaseApi.deleteChild).mockReset();
  });

  afterEach(() => {
    cleanup();
    clients.splice(0).forEach(client => client.clear());
    vi.restoreAllMocks();
  });

  it.each([
    { name: 'přímé přepnutí A → B', logout: false, next: sessionB, expected: childrenB },
    { name: 'A → odhlášení → B', logout: true, next: sessionB, expected: childrenB },
    { name: 'nové přihlášení stejného A', logout: true, next: sessionA, expected: freshChildrenA },
  ])('$name skryje staré děti i během čekání na nový seznam', async ({ logout, next, expected }) => {
    const pending = deferred<Child[]>();
    vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce(childrenA).mockReturnValueOnce(pending.promise);
    const { client } = setup();
    await waitFor(() => expectList(childrenA));
    const original = client.getQueryCache().find({ queryKey: key, exact: true });
    if (logout) {
      await emit('SIGNED_OUT', null);
      expect(auth().id).toBeNull();
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
      expect(client.getQueryState(key)).toBeUndefined();
    }
    await emit('SIGNED_IN', next);
    await waitFor(() => expect(supabaseApi.getChildren).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('children-list')).toHaveTextContent('čeká');
    expect(screen.queryByText('Ema', { exact: false })).not.toBeInTheDocument();
    expect(client.getQueryData(key)).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: key, exact: true })).not.toBe(original);
    await act(async () => { pending.resolve(expected); await pending.promise; });
    await waitFor(() => expectList(expected));
    expect(client.getQueryData(key)).toEqual(expected);
  });

  it.each([false, true])('opožděný fetch A nepřepíše B (přes odhlášení: %s)', async logout => {
    const oldFetch = deferred<Child[]>();
    const newFetch = deferred<Child[]>();
    vi.mocked(supabaseApi.getChildren).mockReturnValueOnce(oldFetch.promise).mockReturnValueOnce(newFetch.promise);
    const { client } = setup();
    await waitFor(() => expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1));
    if (logout) {
      await emit('SIGNED_OUT', null);
      expect(screen.queryByTestId('children-list')).not.toBeInTheDocument();
      expect(client.getQueryState(key)).toBeUndefined();
    }
    await emit('SIGNED_IN', sessionB);
    await waitFor(() => expect(supabaseApi.getChildren).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('children-list')).toHaveTextContent('čeká');
    await act(async () => { newFetch.resolve(childrenB); await newFetch.promise; });
    await waitFor(() => expectList(childrenB));
    await act(async () => { oldFetch.resolve(childrenA); await oldFetch.promise; });
    expectList(childrenB);
    expect(client.getQueryData(key)).toEqual(childrenB);
    expect(client.isFetching()).toBe(0);
  });

  it.each([
    { name: 'po odhlášení neobnoví cache', next: null, logout: true, expected: null },
    { name: 'po opětovném přihlášení A nepřepíše nová data', next: sessionA, logout: true, expected: freshChildrenA },
    { name: 'po přímém přepnutí na B nepřepíše jeho děti', next: sessionB, logout: false, expected: childrenB },
    { name: 'po odhlášení a přihlášení B nepřepíše jeho děti', next: sessionB, logout: true, expected: childrenB },
  ])('opožděný rollback $name', async ({ next, logout, expected }) => {
    const deletion = deferred<void>();
    const unexpectedRefetch = deferred<Child[]>();
    vi.mocked(supabaseApi.deleteChild).mockReturnValueOnce(deletion.promise);
    vi.mocked(supabaseApi.getChildren).mockReturnValue(unexpectedRefetch.promise).mockResolvedValueOnce(childrenA);
    const { client } = setup();
    await waitFor(() => expectList(childrenA));
    fireEvent.click(screen.getByRole('button', { name: 'Smazat' }));
    await waitFor(() => { expect(supabaseApi.deleteChild).toHaveBeenCalledWith(1); expectList([]); });
    expect(client.getQueryData(key)).toEqual([]);
    expect(client.isMutating()).toBe(1);
    if (logout) {
      await emit('SIGNED_OUT', null);
      expect(client.getQueryState(key)).toBeUndefined();
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
    }
    if (next && expected) {
      vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce(expected);
      await emit('SIGNED_IN', next);
      await waitFor(() => expectList(expected));
    }
    const calls = vi.mocked(supabaseApi.getChildren).mock.calls.length;
    await act(async () => { deletion.reject(new Error('delete failed')); await deletion.promise.catch(() => {}); });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(calls);
    if (expected) {
      expectList(expected);
      expect(client.getQueryData(key)).toEqual(expected);
      expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    } else {
      expect(client.getQueryState(key)).toBeUndefined();
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
    }
  });

  it.each([false, true])('změna přihlášení během await cancelQueries zabrání zápisu onMutate (B: %s)', async switchToB => {
    const gate = deferred<void>();
    vi.mocked(supabaseApi.deleteChild).mockResolvedValue(undefined);
    const { client } = setup();
    await waitFor(() => expectList(childrenA));
    const realCancel = client.cancelQueries.bind(client);
    const cancel = vi.spyOn(client, 'cancelQueries').mockImplementationOnce(async (...args) => {
      await realCancel(...args);
      await gate.promise;
    });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Smazat' }));
      await waitFor(() => expect(cancel).toHaveBeenCalledWith({ queryKey: key }));
      expect(supabaseApi.deleteChild).not.toHaveBeenCalled();
      expect(client.isMutating()).toBe(1);
      expect(client.getQueryData(key)).toEqual(childrenA);
      await emit('SIGNED_OUT', null);
      expect(client.getQueryState(key)).toBeUndefined();
      if (switchToB) {
        vi.mocked(supabaseApi.getChildren).mockResolvedValue(childrenB);
        await emit('SIGNED_IN', sessionB);
        await waitFor(() => expectList(childrenB));
      }
      await act(async () => { gate.resolve(); await gate.promise; });
      await waitFor(() => expect(client.isMutating()).toBe(0));
      if (switchToB) {
        expectList(childrenB);
        expect(client.getQueryData(key)).toEqual(childrenB);
        expect(client.getQueryState(key)?.isInvalidated).toBe(false);
      } else {
        expect(client.getQueryState(key)).toBeUndefined();
        expect(screen.queryByTestId('children-list')).not.toBeInTheDocument();
      }
    } finally {
      gate.resolve();
      await waitFor(() => expect(client.isMutating()).toBe(0));
      cancel.mockRestore();
    }
  });

  it.each([
    { name: 'bez změny přihlášení obnoví dotaz', next: null, logout: false },
    { name: 'po přímém přepnutí na B neinvaliduje jeho dotaz', next: sessionB, logout: false },
    { name: 'po odhlášení a přihlášení B neinvaliduje jeho dotaz', next: sessionB, logout: true },
    { name: 'po novém přihlášení A neinvaliduje jeho dotaz', next: sessionA, logout: true },
  ])('dokončení přidávání $name', async ({ next, logout }) => {
    const addition = deferred<void>();
    const refetch = deferred<Child[]>();
    vi.mocked(supabaseApi.addChild).mockReturnValueOnce(addition.promise);
    vi.mocked(supabaseApi.getChildren).mockReturnValue(refetch.promise).mockResolvedValueOnce(childrenA);
    const app = setup();
    await waitFor(() => expectList(childrenA));
    fireEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await waitFor(() => expect(supabaseApi.addChild).toHaveBeenCalledWith(newChild));
    expect(app.client.isMutating()).toBe(1);
    if (logout) {
      await emit('SIGNED_OUT', null);
      expect(app.client.getQueryState(key)).toBeUndefined();
    }
    const expected = next?.user.id === 'user-B' ? childrenB : freshChildrenA;
    if (next) {
      vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce(expected);
      await emit('SIGNED_IN', next);
      await waitFor(() => expectList(expected));
    }
    const calls = vi.mocked(supabaseApi.getChildren).mock.calls.length;
    expect(app.client.getQueryState(key)?.isInvalidated).toBe(false);
    await act(async () => { addition.resolve(); await app.finishAdd(); });
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(app.client.getQueryState(key)?.isInvalidated).toBe(next === null);
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(calls + (next ? 0 : 1));
    expect(app.client.getQueryData(key)).toEqual(next ? expected : childrenA);
    expectList(next ? expected : childrenA);
  });

  it.each([false, true])('přidávání bez původního seznamu respektuje pozdější seznam (nové přihlášení A: %s)', async relogin => {
    const addition = deferred<void>();
    const refetch = deferred<Child[]>();
    vi.mocked(supabaseApi.addChild).mockReturnValueOnce(addition.promise);
    vi.mocked(supabaseApi.getChildren).mockReturnValue(refetch.promise).mockResolvedValueOnce(freshChildrenA);
    const app = setup({ showList: false });
    await waitFor(() => expect(auth().id).toBe('user-A'));
    expect(app.client.getQueryState(key)).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await waitFor(() => expect(supabaseApi.addChild).toHaveBeenCalledWith(newChild));
    expect(supabaseApi.getChildren).not.toHaveBeenCalled();
    if (relogin) {
      await emit('SIGNED_OUT', null);
      expect(app.client.getQueryState(key)).toBeUndefined();
      await emit('SIGNED_IN', { ...sessionA, access_token: 'nové-přihlášení' });
    }
    app.showList();
    await waitFor(() => expectList(freshChildrenA));
    expect(app.client.isMutating()).toBe(1);
    expect(app.client.getQueryState(key)?.isInvalidated).toBe(false);
    await act(async () => { addition.resolve(); await app.finishAdd(); });
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(relogin ? 1 : 2);
    expect(app.client.getQueryState(key)?.isInvalidated).toBe(!relogin);
    expect(app.client.getQueryData(key)).toEqual(freshChildrenA);
    expectList(freshChildrenA);
  });

  it('obnovení tokenu stejného účtu zachová dotaz, generaci i platnost rozpracované mutace', async () => {
    const addition = deferred<void>();
    const refetch = deferred<Child[]>();
    vi.mocked(supabaseApi.addChild).mockReturnValueOnce(addition.promise);
    vi.mocked(supabaseApi.getChildren).mockResolvedValueOnce(childrenA).mockReturnValue(refetch.promise);
    const app = setup();
    await waitFor(() => expectList(childrenA));
    const original = app.client.getQueryCache().find({ queryKey: key, exact: true });
    const generation = auth().generation;
    const list = screen.getByTestId('children-list');
    fireEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await waitFor(() => expect(supabaseApi.addChild).toHaveBeenCalledWith(newChild));
    await emit('TOKEN_REFRESHED', { ...sessionA, access_token: 'obnovený-token' });
    expect(auth()).toEqual({ id: 'user-A', token: 'obnovený-token', generation });
    expect(app.client.getQueryCache().find({ queryKey: key, exact: true })).toBe(original);
    expect(screen.getByTestId('children-list')).toBe(list);
    expectList(childrenA);
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1);
    await act(async () => { addition.resolve(); await app.finishAdd(); });
    await waitFor(() => expect(app.client.isMutating()).toBe(0));
    expect(app.client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(2);
  });

  it('odhlášení odstraní celou rodinu dotazů dětí, ale ponechá nesouvisející cache', async () => {
    const { client } = setup({ showList: false });
    await waitFor(() => expect(auth().id).toBe('user-A'));
    client.setQueryData(key, childrenA);
    client.setQueryData([...ChildrenKeys.all, 'detail', 1], childrenA[0]);
    client.setQueryData(['weather'], 'slunce');
    await emit('SIGNED_OUT', null);
    expect(auth().id).toBeNull();
    expect(client.getQueryCache().findAll({ queryKey: ChildrenKeys.all })).toEqual([]);
    expect(client.getQueryData(['weather'])).toBe('slunce');
    expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
  });

  it.each([
    { name: 'přihlášení B', event: 'SIGNED_IN' as const, next: sessionB },
    { name: 'odhlášení', event: 'SIGNED_OUT' as const, next: null },
  ])('událost $name má přednost před opožděným getSession s účtem A', async ({ event, next }) => {
    const lookup = deferred<Awaited<ReturnType<typeof supabase.auth.getSession>>>();
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(lookup.promise);
    vi.mocked(supabaseApi.getChildren).mockResolvedValue(childrenB);
    const { client } = setup();
    expect(auth().id).toBe('čeká');
    expect(supabaseApi.getChildren).not.toHaveBeenCalled();
    expect(vi.mocked(supabase.auth.onAuthStateChange).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(supabase.auth.getSession).mock.invocationCallOrder[0]);
    await emit(event, next);
    if (next) await waitFor(() => expectList(childrenB));
    const generation = auth().generation;
    await act(async () => { lookup.resolve({ data: { session: sessionA }, error: null }); await lookup.promise; });
    expect(auth().id).toBe(next?.user.id ?? null);
    expect(auth().generation).toBe(generation);
    if (next) {
      expectList(childrenB);
      expect(client.getQueryData(key)).toEqual(childrenB);
    } else {
      expect(screen.queryByTestId('private-content')).not.toBeInTheDocument();
      expect(supabaseApi.getChildren).not.toHaveBeenCalled();
      expect(client.getQueryState(key)).toBeUndefined();
    }
  });

  it('cleanup odhlásí odběr a ignoruje starý callback i čekající getSession po odpojení', async () => {
    const lookup = deferred<Awaited<ReturnType<typeof supabase.auth.getSession>>>();
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(lookup.promise);
    const app = setup();
    const unsubscribe = vi.mocked(supabase.auth.onAuthStateChange).mock.results[0].value.data.subscription.unsubscribe;
    app.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    app.client.setQueryData(key, childrenB);
    const remove = vi.spyOn(app.client, 'removeQueries');
    await emit('SIGNED_OUT', null);
    await act(async () => { lookup.resolve({ data: { session: sessionA }, error: null }); await lookup.promise; });
    expect(remove).not.toHaveBeenCalled();
    expect(app.client.getQueryData(key)).toEqual(childrenB);
    expect(supabaseApi.getChildren).not.toHaveBeenCalled();
  });

  it('StrictMode nedovolí prvnímu efektu přepsat session druhého efektu starým lookupem ani callbackem', async () => {
    const oldLookup = deferred<Awaited<ReturnType<typeof supabase.auth.getSession>>>();
    const currentLookup = deferred<Awaited<ReturnType<typeof supabase.auth.getSession>>>();
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(oldLookup.promise).mockReturnValueOnce(currentLookup.promise);
    vi.mocked(supabaseApi.getChildren).mockResolvedValue(childrenB);
    const { client } = setup({ strict: true });
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2);
    const oldSubscription = vi.mocked(supabase.auth.onAuthStateChange).mock.results[0].value.data.subscription;
    expect(oldSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    // Druhý efekt nedostal auth událost: starý lookup musí blokovat jeho vlastní active flag.
    await act(async () => { currentLookup.resolve({ data: { session: sessionB }, error: null }); await currentLookup.promise; });
    await waitFor(() => expectList(childrenB));
    const generation = auth().generation;
    const query = client.getQueryCache().find({ queryKey: key, exact: true });
    await emit('SIGNED_OUT', null, 0);
    await act(async () => { oldLookup.resolve({ data: { session: sessionA }, error: null }); await oldLookup.promise; });
    expect(auth().id).toBe('user-B');
    expect(auth().generation).toBe(generation);
    expectList(childrenB);
    expect(client.getQueryData(key)).toEqual(childrenB);
    expect(client.getQueryCache().find({ queryKey: key, exact: true })).toBe(query);
    expect(supabaseApi.getChildren).toHaveBeenCalledTimes(1);
  });
});