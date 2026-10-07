import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from './i18n';
import cs from './locales/cs.json';
import en from './locales/en.json';
import { CLOTHES } from '../modules/clothing/clothesCatalog';
import { conditions } from '../../server/weather/weatherConditions';
import { translateWeatherDescription } from '../modules/weather/helpers/translateWeatherDescription';
import { addChildSchema } from '../modules/children/components/addChildForm/addChildForm.schema';
import { ToastProvider } from '../components/toast/toastProvider';
import SessionRecovery from '../modules/auth/components/sessionRecovery';
import ChildPackingCard from '../pages/overview/components/childPackingCard';
import DataAttribution from '../modules/weather/components/dataAttribution';
import AddChildForm from '../modules/children/components/addChildForm/addChildForm';

const addChild = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../modules/children/hooks/useAddChildMutation', () => ({
  useAddChildMutation: () => ({ mutateAsync: addChild, isPending: false }),
}));

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'string' ? [path] : keys(entry, path);
  });
}

function baseKeys(value: object) {
  return [...new Set(keys(value).map((key) => key.replace(/_(one|few|many|other)$/, '')))].sort();
}

describe('translations', () => {
  it('provides equivalent keys in both languages without relying on fallback', () => {
    expect(baseKeys(cs)).toEqual(baseKeys(en));
    for (const [language, resource] of Object.entries({ cs, en })) {
      const t = i18n.getFixedT(language);
      for (const key of keys(resource)) {
        expect(t(key, { fallbackLng: false })).not.toBe(key);
        expect(t(key, { fallbackLng: false })).not.toBe('');
      }
    }
  });

  it.each(['cs', 'en'])('covers every catalog item and API weather condition in %s', (language) => {
    const t = i18n.getFixedT(language);
    for (const item of CLOTHES) {
      const key = `clothing.${item.name}`;
      expect(t(key, { fallbackLng: false })).not.toBe(key);
    }
    for (const { description } of Object.values(conditions)) {
      const key = `weather.conditions.${description}`;
      expect(t(key, { fallbackLng: false })).not.toBe(key);
    }
    expect(translateWeatherDescription('', t)).toBe(t('weather.unknownCondition'));
    expect(translateWeatherDescription('Unexpected condition', t)).toBe('Unexpected condition');
  });

  it.each([
    [0, '0 let'],
    [1, '1 rok'],
    [2, '2 roky'],
    [4, '4 roky'],
    [5, '5 let'],
  ])('uses Czech age plurals for %s', (count, expected) => {
    expect(i18n.getFixedT('cs')('children.ageYears', { count })).toBe(expected);
  });

  it('interpolates the location and translates validation keys at render time', () => {
    const t = i18n.getFixedT('cs');
    expect(t('weather.forLocation', { location: 'Praha, CZ' })).toBe(
      'Počasí pro lokalitu Praha, CZ',
    );
    const result = addChildSchema.safeParse({ name: '', age: '', sex: '' });
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected validation errors');
    expect(result.error.issues.map((issue) => t(issue.message))).toEqual([
      'Jméno musí obsahovat alespoň 2 znaky',
      'Vyberte věk',
    ]);
  });

  it('renders Czech recovery feedback, translates on language change and keeps retry working', async () => {
    await i18n.changeLanguage('cs');
    const user = userEvent.setup();
    const retry = vi.fn();
    render(
      <ToastProvider>
        <SessionRecovery onRetry={retry} />
      </ToastProvider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Nepodařilo se obnovit přihlášení');
    expect(screen.getByText('Přístup k účtu je momentálně nedostupný.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zavřít' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Zkusit znovu' }));
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not restore your session');
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders Czech clothing, plurals and attribution links', async () => {
    await i18n.changeLanguage('cs');
    render(
      <>
        <ChildPackingCard
          child={{ id: 1, name: 'Ema', age: 2, sex: 'female' }}
          clothes={[CLOTHES[0]]}
        />
        <DataAttribution />
      </>,
    );
    expect(screen.getByText('2 roky')).toBeVisible();
    expect(screen.getByText('tričko')).toBeVisible();
    expect(screen.getByText('Oblečení na zbytek dne — připravte si 1 kus.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
    expect(screen.getByRole('link', { name: 'GeoNames' })).toHaveAttribute(
      'href',
      'https://www.geonames.org/',
    );
    expect(screen.getByText(/Údaje o počasí poskytuje/)).toBeVisible();
  });

  it('translates form errors while preserving the stored sex value', async () => {
    await i18n.changeLanguage('cs');
    addChild.mockClear();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <AddChildForm />
        </ToastProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Přidat dítě' }));
    expect(screen.getByText('Jméno musí obsahovat alespoň 2 znaky')).toBeVisible();
    expect(screen.getByText('Vyberte věk')).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Jméno' }), 'Ema');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Věk' }), '2');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Pohlaví' }),
      screen.getByRole('option', { name: 'Dívka' }),
    );
    await user.click(screen.getByRole('button', { name: 'Přidat dítě' }));
    expect(addChild).toHaveBeenCalledWith({ name: 'Ema', age: 2, sex: 'female' });
  });
});
