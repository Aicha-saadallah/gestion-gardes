import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export const LangSwitcher = () => {
  const router = useRouter();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = i18n.language === 'fr' ? 'en' : 'fr';
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  return <button onClick={toggleLanguage}>Switch Language</button>;
};
