import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

const inputStyle = {
  padding: "0.6rem",
  borderRadius: "0.3rem",
  border: "1px solid #ced4da",
  fontSize: "0.9rem",
  marginBottom: "0.5rem",
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "0.75rem 1rem",
  borderRadius: "0.3rem",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "500",
  transition: "background-color 0.3s ease",
};

const primaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#3252e3", // Couleur bleue d'origine pour "Enregistrer les modifications"
  color: "white",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6c757d",
  color: "white",
  marginLeft: "0.5rem",
};

const formContainerStyle = {
  maxWidth: "400px",
  margin: "2rem auto",
  padding: "1.5rem",
  border: "1px solid #ccc",
  borderRadius: "0.5rem",
  backgroundColor: "#f8f9fa",
};

const h2Style = {
  textAlign: "center",
  marginBottom: "1rem",
};

const servicesList = [
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
  "Laboratoire d'immunologie",
];

export default function ModifierMedecin() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();
  const { id: medecinId } = router.query;

  useEffect(() => {
    if (medecinId) {
      fetchMedecin(medecinId);
    }
  }, [medecinId]);

  const fetchMedecin = async (id) => {
    try {
      const response = await axios.get(`/api/back/mod/article?id=${id}`);
      const medecinData = response.data?.members?.[0];
      if (medecinData) {
        setNom(medecinData.nom);
        setPrenom(medecinData.prenom);
        setEmail(medecinData.email);
        setService(medecinData.service || servicesList[0] || "");
        setRole(medecinData.role);
      } else {
        alert("Médecin non trouvé.");
        router.push("/front/MedecinsList");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du médecin:", error);
      alert("Erreur lors de la récupération des informations du médecin.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedMedecin = { nom, prenom, email, service, role };
      const response = await axios.put(`/api/back/mod/article?id=${medecinId}`, updatedMedecin);
      if (response.status === 200) {
        alert("Informations du médecin mises à jour avec succès!");
        router.push("/front/MedecinsList");
      } else {
        alert("Erreur lors de la mise à jour des informations du médecin.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du médecin:", error);
      alert("Une erreur s'est produite lors de la mise à jour.");
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={h2Style}>Modifier le Médecin</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' }}
          >
            {servicesList.map((serviceOption) => (
              <option key={serviceOption} value={serviceOption}>
                {serviceOption}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' }}
          >
            <option value="Médecin">Médecin</option>
            <option value="Chef de service">Chef de service</option>
            {/* Ajoutez d'autres rôles si nécessaire */}
          </select>
        </div>
        <button type="submit" style={primaryButtonStyle}>
          Enregistrer les modifications
        </button>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={() => router.push("/front/MedecinsList")}
        >
          Annuler
        </button>
      </form>
    </div>
  );
}