import { StrictMode, useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from './toastProvider';
import { useToast } from './toastContext';

const notification = { id: 'delete', title: 'Delete failed', message: 'Please try again.' };

function Example() {
  const { showError } = useToast();
  useEffect(() => {
    showError(notification);
  }, [showError]);
  return <button onClick={() => showError(notification)}>Fail again</button>;
}

describe('ToastProvider', () => {
  it('deduplicates errors, dismisses them and allows another failure', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <ToastProvider>
          <Example />
        </ToastProvider>
      </StrictMode>,
    );
    expect(await screen.findByText('Delete failed')).toBeVisible();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Fail again' }));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Delete failed')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Fail again' }));
    expect(await screen.findByText('Delete failed')).toBeVisible();
  });
});
