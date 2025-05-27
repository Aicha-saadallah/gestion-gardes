import React, { useState } from 'react';
import styles from '../../styles/login.module.css'; 
import Header from '@/components/head';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Login = () => {
  const { i18n,t } = useTranslation('common'); // Using the "common" namespace
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
console.log('Current language:', i18n.language);
console.log('login.title:', t('login.title'));
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/back/mod/login', {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        switch (response.data.user.role) {
          case 'Superviseur':
          case 'Administrateur':
            router.push('/front/superviseur');
            break;
          case 'Médecin':
            router.push('/front/medecin');
            break;
          case 'Chef de service':
            router.push('/front/service');
            break;
          default:
            router.push('/');
        }
      } else {
        setError(response.data.message || t('login.errors.invalid_credentials'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.errors.server_error'));
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.leftPanel}></div>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <h2 className={styles.title}>{t('login.title')}</h2>
            <p className={styles.subtitle}>{t('login.subtitle')}</p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('login.labels.email')}</label>
              <input
                type="email"
                className={styles.inputField}
                placeholder={t('login.placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('login.labels.password')}</label>
              <input
                type="password"
                className={styles.inputField}
                placeholder={t('login.placeholders.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.button}>
              {t('login.buttons.submit')}
            </button>
          </form>

          <div className={styles.links}>
            <a href="/" className={styles.link}>{t('login.links.forgot_password')}</a>
            <a href="/front/add" className={styles.link}>{t('login.links.create_account')}</a>
          </div>
        </div>
      </div>
    </>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default Login;
