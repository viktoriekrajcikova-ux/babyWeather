import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../components/toast/toastProvider';
import LocationSearch from '../components/locationSearch';
import { geocodingApi } from '../api/geocodingApiClient';

vi.mock('../api/geocodingApiClient', () => ({ geocodingApi: { geocode: vi.fn() } }));

function setup() {
  const onLocationSelect = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = (showSearch: boolean) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {showSearch && <LocationSearch onLocationSelect={onLocationSelect} />}
      </ToastProvider>
    </QueryClientProvider>
  );
  const result = render(tree(true));
  return { onLocationSelect, hideSearch: () => result.rerender(tree(false)) };
}

describe('LocationSearch errors', () => {
  beforeEach(() => vi.resetAllMocks());

  it('repeats a failed search after dismissal and forwards only a successful result', async () => {
    const user = userEvent.setup();
    vi.mocked(geocodingApi.geocode).mockRejectedValue(new Error('unavailable'));
    const { onLocationSelect } = setup();
    await user.type(screen.getByRole('textbox', { name: 'City' }), ' Prague ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not find that location');
    expect(geocodingApi.geocode).toHaveBeenCalledWith('Prague');
    expect(onLocationSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    const location = { name: 'Prague', country: 'CZ', lat: 50, lon: 14 };
    vi.mocked(geocodingApi.geocode).mockResolvedValue(location);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(onLocationSelect).toHaveBeenCalledWith(location));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('does not search whitespace and clears a toast when the search component unmounts', async () => {
    const user = userEvent.setup();
    vi.mocked(geocodingApi.geocode).mockRejectedValue(new Error('unavailable'));
    const { hideSearch } = setup();
    await user.type(screen.getByRole('textbox', { name: 'City' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(geocodingApi.geocode).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'City' }), 'Unknown');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    hideSearch();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
