import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../../../app/queryClient';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';

vi.mock('../api/childrenApi', () => ({
  childrenApi: { getChildren: vi.fn(), addChild: vi.fn(), deleteChild: vi.fn() },
}));

import { childrenApi } from '../api/childrenApi';
import AddChildForm from '../components/addChildForm/addChildForm';

const auth: AuthContextValue = {
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getAuthGeneration: () => 0,
};

describe('AddChildForm', () => {
  it('při prázdném odeslání zobrazí chyby jména a věku a dítě neuloží', async () => {
    const user = userEvent.setup();
    // Real mutation hook + global MutationCache, so the error toast comes from the shared handler.
    const queryClient = createQueryClient({ mutations: { retry: false } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter>
            <Toaster />
            <AddChildForm />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Add child' }));

    expect(screen.getByText('Name must contain at least 2 characters')).toBeVisible();
    expect(screen.getByText('Select an age')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'First name' })).toHaveAccessibleDescription(
      'Name must contain at least 2 characters',
    );
    expect(screen.getByRole('combobox', { name: 'Age' })).toHaveAccessibleDescription(
      'Select an age',
    );
    expect(screen.getByRole('combobox', { name: 'Sex' })).toHaveAttribute('aria-invalid', 'false');
    expect(childrenApi.addChild).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.mocked(childrenApi.addChild).mockRejectedValue(new Error('server failure'));
    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Ema');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Age' }), '2');
    await user.click(screen.getByRole('button', { name: 'Add child' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Could not add child');
    expect(screen.getByRole('textbox', { name: 'First name' })).toHaveValue('Ema');
    expect(screen.getByRole('combobox', { name: 'Age' })).toHaveValue('2');
  });
});
