import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider as JotaiProvider } from 'jotai';
import toast, { Toaster } from 'react-hot-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../../../app/queryClient';
import { geocodingApi } from '../api/geocodingApiClient';
import { selectedLocationAtom } from '../atoms/selectedLocationAtom';
import LocationSearch from '../components/locationSearch';

vi.mock('../api/geocodingApiClient', () => ({ geocodingApi: { geocode: vi.fn() } }));

function setup() {
  const store = createStore();
  const initialLocation = { lat: 49.3547, lon: 17.8694 };
  store.set(selectedLocationAtom, initialLocation);
  const queryClient = createQueryClient({ queries: { retry: false } });
  render(
    <JotaiProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <LocationSearch />
      </QueryClientProvider>
    </JotaiProvider>,
  );
  return { store, initialLocation };
}

describe('LocationSearch errors', () => {
  beforeEach(() => vi.resetAllMocks());

  it('repeats a failed search after dismissal and stores only a successful result', async () => {
    const user = userEvent.setup();
    vi.mocked(geocodingApi.geocode).mockRejectedValue(new Error('unavailable'));
    const { store, initialLocation } = setup();
    await user.type(screen.getByRole('textbox', { name: 'City' }), ' Prague ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Could not find that location');
    expect(geocodingApi.geocode).toHaveBeenCalledWith('Prague');
    expect(store.get(selectedLocationAtom)).toEqual(initialLocation);
    act(() => toast.dismiss('location-search'));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
      timeout: 2000,
    });
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('status')).toBeVisible();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(store.get(selectedLocationAtom)).toEqual(initialLocation);
    const location = { name: 'Prague', country: 'CZ', lat: 50, lon: 14 };
    vi.mocked(geocodingApi.geocode).mockResolvedValue(location);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(store.get(selectedLocationAtom)).toEqual(location));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
      timeout: 2000,
    });
  }, 10000);

  it('does not search whitespace', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('textbox', { name: 'City' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(geocodingApi.geocode).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps a single toast when different searches fail one after another', async () => {
    const user = userEvent.setup();
    vi.mocked(geocodingApi.geocode).mockRejectedValue(new Error('unavailable'));
    setup();
    const input = screen.getByRole('textbox', { name: 'City' });
    await user.type(input, 'Pargue');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Could not find that location');
    await user.clear(input);
    await user.type(input, 'Brnoo');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(geocodingApi.geocode).toHaveBeenCalledWith('Brnoo'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled());
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
