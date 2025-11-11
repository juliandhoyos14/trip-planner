import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import es from '../locales/es';

const translations = { en, es };

export const useTranslations = () => {
  const { language } = useLanguage();
  return translations[language];
};
