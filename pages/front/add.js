// pages/front/inscription.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import style from "@/styles/inscription.module.css";

import { Modal, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import allServices from '@/data/services';

export default function Inscription() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [role, setRole] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [servicesAvecChef, setServicesAvecChef] = useState([]);

  const router = useRouter();

  useEffect(() => {
    axios.get('/api/back/mod/chefs-par-service')
      .then(response => {
        setServicesAvecChef(response.data.map(item => item.service));
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des chefs par service :", error);
      });
  }, []);

  useEffect(() => {
    if (serviceInput.length > 1) {
      const filtered = allServices.filter(service =>
        service.toLowerCase().includes(serviceInput.toLowerCase())
      );
      setFilteredServices(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredServices([]);
      setShowSuggestions(false);
    }
  }, [serviceInput]);

  const handleServiceSelect = (service) => {
    setServiceInput(service);
    setShowSuggestions(false);
  };

  const hasChef = (service) => {
    return servicesAvecChef.includes(service);
  };

  async function ajouterInfo() {
    if (isSubmitting) return;

    if (!nom || !prenom || !role || !email || !password ||
      ((role === "Médecin" || role === "Chef de service") && !serviceInput)) {
      setMessage({ type: "error", text: "❌ Tous les champs obligatoires doivent être remplis" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "❌ Veuillez entrer une adresse email valide" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "❌ Le mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await axios.post("/api/back", {
        nom,
        prenom,
        role,
        service: role === "Médecin" || role === "Chef de service" ? serviceInput : "",
        email,
        password,
      });

      if (response.data.success) {
        if (role === "Médecin") {
          setSuccessMessage("Votre demande d'inscription a été envoyée pour approbation.");
          setShowSuccessModal(true);
          localStorage.setItem('tempUser', JSON.stringify({ email, role, status: 'pending' }));
        } else if (role === "Chef de service") {
          setSuccessMessage("Inscription réussie ! Redirection en cours...");
          setShowSuccessModal(true);
          localStorage.setItem('token', 'chef_de_service_token'); // Simuler un token
          setTimeout(() => {
            router.push("/front/service");
          }, 2000);
        }
      } else {
        setMessage({ type: "error", text: `❌ ${response.data.message}` });
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      const errorMsg = error.response?.data?.message || "Une erreur est survenue lors de l'inscription";
      setMessage({ type: "error", text: `❌ ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    if (role === "Médecin") {
      router.push("/front/waiting-approval");
    } else if (role === "Chef de service") {
      router.push("/front/service");
    }
  };

  return (
    <>
      
      <div className={style.container}>
        <div className={style.formContainer}>
          <h2 className={style.title}>Inscription</h2>

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
              <select value={role} onChange={(e) => { setRole(e.target.value); setServiceInput(""); }} required className={style.select}>
                <option value="">Sélectionnez un rôle</option>
                <option value="Médecin">Médecin</option>
                <option value="Chef de service">Chef de service</option>
              </select>
            </div>

            {(role === "Médecin" || role === "Chef de service") && (
              <div className={style.inputGroup}>
                <label>Service :</label>
                <div className={style.serviceAutocomplete}>
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onFocus={() => serviceInput.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Rechercher ou saisir un service"
                    required
                    className={style.input}
                  />
                  {showSuggestions && filteredServices.length > 0 && (
                    <ul className={style.suggestionsList}>
                      {filteredServices.map((service, index) => (
                        <li
                          key={index}
                          onClick={() => handleServiceSelect(service)}
                          className={`${style.suggestionItem} ${hasChef(service) ? style.serviceAvecChef : ''}`}
                          title={hasChef(service) ? "Ce service a déjà un chef" : ""}
                        >
                          {service}
                          {hasChef(service) && <span style={{ marginLeft: '5px', color: 'red' }}>(Occupé)</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

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
              disabled={isSubmitting || (role === "Chef de service" && hasChef(serviceInput))}
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

      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Inscription</Modal.Title>
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
            {role === "Médecin" ? "Compris" : "Continuer"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}