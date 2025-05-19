import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import style from "@/styles/inscription.module.css";
import Header from "@/components/head";
import { Modal, Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

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

  const allServices = [
    "Radiothérapie carcinologique",
    "Chirurgie générale",
    "Laboratoire de biochimie",
    "Médecine des urgences",
    "Pédiatrie",
    "Laboratoire de parasitologie",
    "Ophtalmologie",
    "Oto-rhino-laryngologie",
    "Cardiologie",
    "Explorations fonctionnelles et physiologie",
    "Consultation externe ORL",
    "Gynécologie-obstétrique",
    "Médecine du travail",
    "Médecine légale",
    "Consultation externe",
    "Hygiène hospitalière",
    "Pneumologie",
    "Pharmacie interne",
    "Radiologie",
    "Médecine interne",
    "Épidémiologie",
    "Salle de prélèvement",
    "Consultation externe de gastro-entérologie",
    "Consultation externe de chirurgie",
    "Consultation externe de rhumatologie",
    "Consultation externe des maladies infectieuses",
    "Finance",
    "Consultation externe de pneumologie",
    "Dermatologie",
    "Anesthésie-réanimation",
    "Biologie de la reproduction",
    "Carcinologie médicale",
    "Endocrinologie",
    "Gastro-entérologie",
    "Génétique",
    "Hématologie biologique ou clinique",
    "Maladies infectieuses",
    "Médecine dentaire",
    "Néonatologie",
    "Orthopédie odonto-faciale",
    "Psychiatrie",
    "Réanimation médicale",
    "Réanimation médicale pédiatrique",
    "Rhumatologie",
    "Consultation externe d'ophtalmologie",
    "Consultation externe de cardiologie",
    "Consultation externe de dermatologie",
    "Consultation externe de pédiatrie",
    "Pharmacie externe",
    "Maintenance",
    "Consultation externe de médecine interne",
    "Consultation externe d'endocrinologie",
    "Laboratoire d'hématologie",
    "Consultation externe d'hématologie biologique ou clinique",
    "Consultation externe d'anesthésie-réanimation",
    "Administration / Direction",
    "Service social",
    "Cytogénétique",
    "Laboratoire d'immunologie"
  ];

  const router = useRouter();

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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  async function ajouterInfo() {
    if (isSubmitting) return;

    // Validation des champs
    if (!nom || !prenom || !role || !email || !password ||
      ((role === "Médecin" || role === "Chef de service") && !serviceInput)) {
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
          setSuccessMessage("Votre demande d'inscription a été envoyée au chef de service pour approbation. Vous recevrez une notification une fois votre compte approuvé.");
          setShowSuccessModal(true);

          // Stocker temporairement les infos utilisateur
          localStorage.setItem('tempUser', JSON.stringify({
            email,
            role,
            status: 'pending'
          }));
        } else {
          setSuccessMessage("Inscription réussie ! Redirection en cours...");
          setShowSuccessModal(true);

          // Stocker le token et rediriger
          localStorage.setItem('token', response.data.token);
          setTimeout(() => {
            if (role === "Superviseur") {
              router.push("/front/superviseur");
            } else if (role === "Chef de service") {
              router.push("/front/service");
            } else if (role === "admin") {
              router.push("/front/admin");
            }
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
    }
  };

  return (
    <>
      <Header />
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
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>Prénom :</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>Rôle :</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setServiceInput("");
                }}
                required
                className={style.select}
              >
                <option value="">Sélectionnez un rôle</option>
                <option value="Médecin">Médecin</option>
                <option value="Chef de service">Chef de service</option>
                <option value="Superviseur">Superviseur</option>
                <option value="admin">Administrateur</option>
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
                          className={style.suggestionItem}
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className={style.inputGroup}>
              <label>Email :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={style.input}
              />
            </div>

            <div className={style.inputGroup}>
              <label>Mot de passe :</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={style.input}
              />
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

      {/* Modal de succès */}
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