import React, { useState } from "react";
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
  backgroundColor: "#28a745", // Vert succès
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

export default function AjouterMedecin() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(servicesList[0] || "");
  const [role, setRole] = useState("Médecin");
  const [password, setPassword] = useState(""); // Ajout de l'état pour le mot de passe
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newMedecin = { nom, prenom, email, service, role, password }; // Inclure le mot de passe
      const response = await axios.post("/api/back/mod/article", newMedecin);
      if (response.status === 200) {
        alert("Médecin ajouté avec succès!");
        router.push("/front/MedecinsList");
      } else {
        alert("Erreur lors de l'ajout du médecin.");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du médecin:", error);
      alert("Une erreur s'est produite lors de l'ajout.");
    }
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={h2Style}>Ajouter un Nouveau Médecin</h2>
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
          <input // Ajout du champ mot de passe
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required // Vous pouvez le rendre facultatif si vous le souhaitez
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
          Ajouter
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