import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../i18n/i18n';
import SessionRecovery from '../modules/auth/components/sessionRecovery';

describe('Application notifications', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    toast.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('deduplicates session failures in StrictMode and updates the translated plain text', async () => {
    render(
      <StrictMode>
        <Toaster position="top-right" />
        <SessionRecovery onRetry={vi.fn()} />
      </StrictMode>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      `${i18n.t('auth.sessionRecovery.title')} ${i18n.t('auth.sessionRecovery.message')}`,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage('cs');
    });
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Nepodařilo se obnovit přihlášení');
  });

  it('expires by default, keeps recovery available and reappears on a later session failure', () => {
    const retry = vi.fn();
    const tree = (failed: boolean) => (
      <>
        <Toaster />
        {failed && <SessionRecovery onRetry={retry} />}
      </>
    );
    const view = render(tree(true));
    expect(screen.getByRole('status')).toBeVisible();
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByRole('status')).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    // Dismissal retains the DOM during the library's default exit animation.
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Account access is currently unavailable.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    view.rerender(tree(false));
    view.rerender(tree(true));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Could not restore your session');
  });

  it('dismisses the session error on recovery without clearing an unrelated notification', () => {
    const tree = (failed: boolean) => (
      <>
        <Toaster />
        {failed && <SessionRecovery onRetry={vi.fn()} />}
      </>
    );
    const view = render(tree(true));
    act(() => {
      toast.error('Another operation failed', { id: 'unrelated' });
    });
    expect(screen.getAllByRole('status')).toHaveLength(2);
    view.rerender(tree(false));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText(/Could not restore your session/)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Another operation failed');
  });
});
