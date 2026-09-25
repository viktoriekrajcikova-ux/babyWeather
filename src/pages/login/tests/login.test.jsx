import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../login';

const mockNavigate = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}));

describe('Login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('pojmenuje hlavní obsah a formulář podle nadpisu aktuálního režimu', async () => {
    const user = userEvent.setup();
    render(<Login />);

    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Login' })).toBeVisible();
    expect(screen.getByRole('form', { name: 'Login' })).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');

    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Create account' })).toBeVisible();
    expect(screen.getByRole('form', { name: 'Create account' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('prázdný formulář neodešle přihlášení ani registraci', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Sign In', exact: true }));

    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(screen.getByLabelText('Password')).toBeInvalid();
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sign Up', exact: true }));

    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(screen.getByLabelText('Password')).toBeInvalid();
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('po přihlášení klávesou Enter zavolá signIn právě jednou a přesměruje na /', async () => {
    mockSignIn.mockResolvedValue({});
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Email'), 'a@b.cz');
    await user.type(screen.getByPlaceholderText('Password'), 'tajneheslo');
    await user.keyboard('{Enter}');

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('a@b.cz', 'tajneheslo');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('během přihlašování blokuje tlačítka a po dokončení je odblokuje', async () => {
    let resolveSignIn;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    mockSignIn.mockReturnValue(signInPromise);
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Email'), 'a@b.cz');
    await user.type(screen.getByLabelText('Password'), 'tajneheslo');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    const modeButton = screen.getByRole('button', { name: 'Create an account' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(modeButton).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Please wait…');
    expect(screen.getByRole('status')).toBeVisible();
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('a@b.cz', 'tajneheslo');
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.click(submitButton);
    await user.click(modeButton);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeVisible();

    await act(async () => {
      resolveSignIn();
      await signInPromise;
    });

    expect(submitButton).toBeEnabled();
    expect(modeButton).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('po neúspěšném přihlášení zobrazí chybu a odblokuje formulář', async () => {
    mockSignIn.mockRejectedValue(new Error('Špatné heslo'));
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText('Email'), 'a@b.cz');
    await user.type(screen.getByPlaceholderText('Password'), 'spatne');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent('Špatné heslo');
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('po registraci se session přes Enter přesměruje na /', async () => {
    mockSignUp.mockResolvedValue({ user: { id: 'test-user' } });
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Email'), 'a@b.cz');
    await user.type(screen.getByLabelText('Password'), 'tajneheslo');
    await user.keyboard('{Enter}');

    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith('a@b.cz', 'tajneheslo');
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('chyba registrace ukončí pending a přepnutí režimu odstraní alert', async () => {
    let rejectSignUp;
    mockSignUp.mockReturnValue(
      new Promise((_, reject) => {
        rejectSignUp = reject;
      }),
    );
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Email'), 'a@b.cz');
    await user.type(screen.getByLabelText('Password'), 'tajneheslo');
    await user.click(screen.getByRole('button', { name: 'Sign Up', exact: true }));

    expect(screen.getByRole('button', { name: 'Sign Up', exact: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back to login' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Please wait…');
    await act(async () => {
      rejectSignUp(new Error('Registration failed'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Registration failed');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up', exact: true })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Back to login' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('po registraci bez session zobrazí výzvu k potvrzení e-mailu a nepřesměruje', async () => {
    mockSignUp.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Email'), 'a@b.cz');
    await user.type(screen.getByLabelText('Password'), 'tajneheslo');
    await user.click(screen.getByRole('button', { name: 'Sign Up', exact: true }));

    expect(await screen.findByText('Check your email to confirm your registration.')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Check your email to confirm your registration.',
    );
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith('a@b.cz', 'tajneheslo');
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
