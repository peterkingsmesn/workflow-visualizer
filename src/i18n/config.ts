import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translations
import enCommon from './locales/en/common.json';
import koCommon from './locales/ko/common.json';
import jaCommon from './locales/ja/common.json';
import zhCommon from './locales/zh/common.json';
import esCommon from './locales/es/common.json';

// Import landing translations
import enLanding from '../locales/en/landing.json';
import koLanding from '../locales/ko/landing.json';

const resources = {
  en: {
    common: enCommon,
    landing: enLanding
  },
  ko: {
    common: koCommon,
    landing: koLanding
  },
  ja: {
    common: jaCommon,
    landing: enLanding // Use English for now
  },
  zh: {
    common: zhCommon,
    landing: enLanding // Use English for now
  },
  es: {
    common: esCommon,
    landing: enLanding // Use English for now
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