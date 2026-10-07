import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './locales/cs.json';
import en from './locales/en.json';

// Keep assistive technologies in sync with the application's language.
i18n.on('languageChanged', (language) => {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: 'cs',
  supportedLngs: ['cs', 'en'],
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
