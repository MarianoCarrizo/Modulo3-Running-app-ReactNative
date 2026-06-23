import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const LANGUAGE_KEY = 'user_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    callback(saved ?? 'es');
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, pt: { translation: pt } },
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

export default i18n;
