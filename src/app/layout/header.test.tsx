import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import i18n from '../../i18n/i18n';
import { createQueryClient } from '../queryClient';
import Header from './header';

vi.mock('../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

function PageLabel() {
  const { t } = useTranslation();
  return <h1>{t('home.title')}</h1>;
}

it('switches both ways and updates navigation, page text and document language', async () => {
  await i18n.changeLanguage('cs');
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <Toaster />
        <Header />
        <PageLabel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const select = screen.getByRole('combobox', { name: 'Jazyk aplikace' });
  expect(select).toHaveValue('cs');
  expect(screen.getByRole('heading', { name: 'Domů' })).toBeVisible();
  await user.selectOptions(select, 'en');
  expect(screen.getByRole('combobox', { name: 'Application language' })).toHaveValue('en');
  expect(screen.getByRole('link', { name: 'HOME' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible();
  expect(document.documentElement.lang).toBe('en');
  await user.selectOptions(select, 'cs');
  expect(screen.getByRole('link', { name: 'DOMŮ' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('heading', { name: 'Domů' })).toBeVisible();
  expect(document.documentElement.lang).toBe('cs');
});
