import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import style from "@/styles/inscription.module.css";

import { Modal, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function InscriptionAdmin() {
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
      setMessage({ type: "error", text: "❌ Tous les champs obligatoires doivent être remplis" });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: "error", text: "❌ Veuillez entrer une adresse email valide" });
      return;
    }

    if (!validatePassword(password)) {
      setMessage({ type: "error", text: "❌ Le mot de passe doit contenir au moins 6 caractères" });
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
        setSuccessMessage(`${response.data.data.role} inscrit avec succès.`);
        setShowSuccessModal(true);
      } else {
        setMessage({ type: "error", text: `❌ ${response.data.message}` });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Une erreur est survenue lors de l'inscription";
      setMessage({ type: "error", text: `❌ ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ Nouvelle version avec redirection stylée
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setTimeout(() => {
      switch (role) {
        case "admin":
        case "Administrateur":
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
          <h2 className={style.title}>Inscription Administrateur/Superviseur</h2>

          {message && (
            <div className={`${style.message} ${message.type === "success" ? style.success : style.error}`}>
              {message.text}
            </div>
          )}

          <div className={style.form}>
            <div className={style.inputGroup}>
              <label>Nom :</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className={style.input} />
            </div>
            <div className={style.inputGroup}>
              <label>Prénom :</label>
              <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required className={style.input} />
            </div>
            <div className={style.inputGroup}>
              <label>Rôle :</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required className={style.select}>
                <option value="">Sélectionnez un rôle</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Superviseur">Superviseur</option>
              </select>
            </div>
            <div className={style.inputGroup}>
              <label>Email :</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={style.input} />
            </div>
            <div className={style.inputGroup}>
              <label>Mot de passe :</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={style.input} />
              <small className={style.passwordHint}>(6 caractères minimum)</small>
            </div>

            <button
              onClick={ajouterInfo}
              className={style.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={style.spinner}></span>
                  En cours...
                </>
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modale de succès stylisée */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>✅ Inscription réussie</Modal.Title>
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
            Continuer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
