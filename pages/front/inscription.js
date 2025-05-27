import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import style from "@/styles/inscription.module.css";

import { Modal, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function InscriptionAdmin() {
  const { i18n, t } = useTranslation('inscription');
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  async function ajouterInfo() {
    if (isSubmitting) return;

    if (!nom || !prenom || !role || !email || !password) {
      setMessage({ type: "error", text: t('messages.required_fields') });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: "error", text: t('messages.invalid_email') });
      return;
    }

    if (!validatePassword(password)) {
      setMessage({ type: "error", text: t('messages.invalid_password') });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await axios.post("/api/back/mod/inscription-admin", {
        nom,
        prenom,
        role,
        email,
        password,
      });

      if (response.data.success) {
        setSuccessMessage(t('messages.success_message', { role: response.data.data.role }));
        setShowSuccessModal(true);
      } else {
        setMessage({ type: "error", text: `❌ ${response.data.message}` });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('messages.registration_error');
      setMessage({ type: "error", text: `❌ ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      switch (role) {
        case "admin":
          router.push("/front/admin");
          break;
        case "Superviseur":
          router.push("/front/superviseur");
          break;
        default:
          router.push("/");
          break;
      }
    }, 300);
  };

  return (
    <>
      <div className={style.container}>
        <div className={style.formContainer}>
          <h2 className={style.title}>{t('title')}</h2>

          {message && (
            <div className={`${style.message} ${message.type === "success" ? style.success : style.error}`}>
              {message.text}
            </div>
          )}

          <div className={style.form}>
            <div className={style.inputGroup}>
              <label>{t('labels.name')}</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>{t('labels.firstname')}</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>{t('labels.role')}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className={style.select}
              >
                <option value="">{t('placeholders.select_role')}</option>
                <option value="admin">{t('placeholders.admin')}</option>
                <option value="Superviseur">{t('placeholders.supervisor')}</option>
              </select>
            </div>

            <div className={style.inputGroup}>
              <label>{t('labels.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>{t('labels.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={style.input}
              />
              <small className={style.passwordHint}>{t('password_hint')}</small>
            </div>

            <button
              onClick={ajouterInfo}
              className={style.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={style.spinner}></span>
                  {t('buttons.loading')}
                </>
              ) : (
                t('buttons.submit')
              )}
            </button>
          </div>
        </div>
      </div>

      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('messages.success_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={style.successContent}>
            <svg className={style.successIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
            </svg>
            <p className={style.successText}>{successMessage}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseSuccessModal}>
            {t('buttons.continue')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['inscription'])),
    },
  };
}
