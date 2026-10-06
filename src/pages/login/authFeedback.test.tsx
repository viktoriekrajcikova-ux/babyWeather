import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../components/toast/toastProvider';
import Login from './login';
import Header from '../../app/layout/header';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }));
vi.mock('../../modules/auth/hooks/useAuth', () => ({ useAuth: () => auth }));

describe('Authentication error toasts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows safe login and registration errors and preserves the email confirmation', async () => {
    const user = userEvent.setup();
    auth.signIn.mockRejectedValue(new Error('private server detail'));
    auth.signUp.mockRejectedValue(new Error('private server detail'));
    render(
      <MemoryRouter>
        <ToastProvider>
          <Login />
        </ToastProvider>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign in');
    expect(screen.queryByText('private server detail')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create account');
    auth.signUp.mockResolvedValue(null);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(await screen.findByText('Check your email to confirm your registration.')).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('reports failed logout and clears the error on retry', async () => {
    const user = userEvent.setup();
    auth.signOut.mockRejectedValueOnce(new Error('failure')).mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <ToastProvider>
          <Header />
        </ToastProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign out');
    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(auth.signOut).toHaveBeenCalledTimes(2);
  });
});
