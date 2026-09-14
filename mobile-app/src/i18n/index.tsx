import React, { createContext, useContext, useState, useEffect } from 'react';
import { es, TranslationKeys } from './locales/es';
import { qu } from './locales/qu';
import { en } from './locales/en';
import { logger } from '@/utils/logger';

export type Language = 'es' | 'qu' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const dictionaries: Record<Language, TranslationKeys> = {
  es,
  qu,
  en,
};

const I18nContext = createContext<I18nContextType>({
  language: 'es',
  setLanguage: () => {},
  t: es,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  const setLanguage = (lang: Language) => {
    logger.info('I18N', `Idioma cambiado a: ${lang.toUpperCase()}`);
    setLanguageState(lang);
  };

  const value = {
    language,
    setLanguage,
    t: dictionaries[language] || es,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation debe utilizarse dentro de un I18nProvider');
  }
  return context;
};

export default useTranslation;
