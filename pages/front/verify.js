import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '@/styles/login.module.css';
import Header from '@/components/head';

export default function VerifyAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/login', {
        email,
        password
      });

      if (response.data.success && response.data.verified) {
        setMessage({ 
          type: 'success', 
          text: '✅ Vérification réussie ! Votre compte est actif.' 
        });
        setIsVerified(true);
        
        // Redirection après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: '❌ Email ou mot de passe incorrect. Veuillez réessayer.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '❌ Erreur lors de la vérification' 
      });
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <h2>Vérification du compte</h2>
          <p>Veuillez entrer vos identifiants pour vérifier votre compte</p>
          
          {message && (
            <div className={`${styles.message} ${
              message.type === 'success' ? styles.success : styles.error
            }`}>
              {message.text}
            </div>
          )}

          {!isVerified ? (
            <form onSubmit={handleVerify}>
              <div className={styles.inputGroup}>
                <label>Email :</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Mot de passe :</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className={styles.button}>
                Vérifier mon compte
              </button>
            </form>
          ) : (
            <div className={styles.successMessage}>
              <p>Votre compte a été vérifié avec succès !</p>
              <p>Redirection vers la page de connexion...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}