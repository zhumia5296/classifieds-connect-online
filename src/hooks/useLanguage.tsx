import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = useCallback((language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [i18n]);

  const currentLanguage = i18n.language;

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'es', name: t('language.spanish'), flag: '🇪🇸' },
    { code: 'fr', name: t('language.french'), flag: '🇫🇷' },
    { code: 'de', name: t('language.german'), flag: '🇩🇪' },
    { code: 'zh', name: t('language.chinese'), flag: '🇨🇳' },
  ];

  return {
    currentLanguage,
    changeLanguage,
    languages,
    t,
  };
};