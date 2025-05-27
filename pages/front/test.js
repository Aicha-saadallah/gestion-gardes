import { LangSwitcher } from '@/components/langSwitcher';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Test() {
  const { t } = useTranslation('common');

  return (
    <div>
        <LangSwitcher />
      <h1>{t('test.title')}</h1>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
