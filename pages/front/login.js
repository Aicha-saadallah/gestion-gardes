import React, { useState } from 'react';
import styles from '../../styles/login.module.css'; 
import Header from '@/components/head';
import axios from 'axios';
import { useRouter } from 'next/router';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

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

        switch(response.data.user.role) {
          case 'Superviseur':
            router.push('/front/superviseur');
            break;
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
        setError(response.data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la connexion');
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.leftPanel}></div>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <h2 className={styles.title}>Bienvenue</h2>
            <p className={styles.subtitle}>Saisissez vos identifiants pour vous connecter</p>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Adresse courriel</label>
              <input 
                type="email" 
                className={styles.inputField}
                placeholder="Entrez votre email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Mot de passe</label>
              <input 
                type="password" 
                className={styles.inputField}
                placeholder="Entrez votre mot de passe"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className={styles.button}>Se connecter</button>
          </form>
          <div className={styles.links}>
            <a href="/" className={styles.link}>Mot de passe oublié ?</a>
            <a href="/front/add" className={styles.link}>Créer un compte</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;