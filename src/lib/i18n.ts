import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import zh from '@/locales/zh.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    // Handle pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Namespace and key separator
    nsSeparator: ':',
    keySeparator: '.',
  });

export default i18n;