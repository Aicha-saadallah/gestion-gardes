import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import styles from '@/styles/waiting.module.css';
import Header from '@/components/head';

export default function WaitingApproval() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/front/login');
      return;
    }

    try {
      const decoded = jwt.decode(token);
      if (decoded.role !== 'Médecin') {
        router.push(decoded.role === 'Chef de service' ? '/front/login' : '/front/medecin');
      } else {
        setUserEmail(decoded.email);
      }
    } catch (err) {
      router.push('/front/login');
    }
  }, [router]);

  useEffect(() => {
    if (!userEmail) return;

    const interval = setInterval(async () => {
      try {
        setChecking(true);
        const response = await axios.get(`/api/back/mod/users?email=${userEmail}`);
        
        if (response.data?.status === 'approved') {
          clearInterval(interval);
          router.push('/front/medecin');
        } else if (response.data?.status === 'rejected') {
          clearInterval(interval);
          localStorage.removeItem('token');
          router.push('/front/login?message=Votre inscription a été rejetée');
        }
      } catch (err) {
        console.error("Erreur de vérification:", err);
      } finally {
        setChecking(false);
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [userEmail, router]);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>En attente d'approbation</h1>
          
          <div className={styles.content}>
            <div className={styles.illustration}>
              <img src="/waiting.svg" alt="En attente" />
            </div>
            
            <div className={styles.message}>
              <p>
                Votre demande d'inscription a été soumise au chef de service.
                Vous recevrez une notification par email une fois votre compte approuvé.
              </p>
              <p>
                Cette page se rafraîchit automatiquement. Vous serez redirigé dès que votre compte sera activé.
              </p>
            </div>
          </div>

          {checking && (
            <div className={styles.checking}>
              <div className={styles.spinner}></div>
              <span>Vérification en cours...</span>
            </div>
          )}

          <button 
            className={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/front/login');
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}