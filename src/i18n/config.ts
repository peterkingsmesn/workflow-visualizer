import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Translations will be loaded dynamically

const resources = {
  en: {
    common: {},
    landing: {}
  },
  ko: {
    common: {},
    landing: {}
  },
  ja: {
    common: {},
    landing: {}
  },
  zh: {
    common: {},
    landing: {}
  },
  es: {
    common: {},
    landing: {}
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Supported languages
    supportedLngs: ['en', 'ko', 'ja', 'zh', 'es'],
    
    // Language detection options
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      lookupQuerystring: 'lng',
      // checkWhitelist is deprecated, use supportedLngs instead
    },
    
    // Force English as default
    lng: 'en',

    interpolation: {
      escapeValue: false // React already does escaping
    },

    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'landing'],

    // React options
    react: {
      useSuspense: false
    }
  });

export default i18n;