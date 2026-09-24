import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAddChildMutation', () => ({
  useAddChildMutation: vi.fn(),
}));

import AddChildForm from '../components/addChildForm/addChildForm';
import { useAddChildMutation } from '../hooks/useAddChildMutation';

describe('AddChildForm', () => {
  it('při prázdném odeslání zobrazí chyby jména a věku a dítě neuloží', async () => {
    const user = userEvent.setup();
    const addChild = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAddChildMutation).mockReturnValue({
      mutateAsync: addChild,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      isIdle: true,
      isPending: false,
      isSuccess: false,
      isError: false,
      isPaused: false,
      data: undefined,
      error: null,
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
    });

    render(
      <MemoryRouter>
        <AddChildForm />
      </MemoryRouter>,
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
    expect(addChild).not.toHaveBeenCalled();
  });
});
