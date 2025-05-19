import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useReactToPrint } from 'react-to-print';

const buttonStyle = {
  padding: "0.5rem 1rem",
  borderRadius: "0.3rem",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  transition: "background-color 0.3s ease",
};

const primaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#3252e3",
  color: "white",
  padding: "0.4rem 0.8rem",
  fontSize: "0.8rem",
};

const successButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#28a745",
  color: "white",
  padding: "0.4rem 0.8rem",
  fontSize: "0.8rem",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6c757d",
  color: "white",
  padding: "0.4rem 0.8rem",
  fontSize: "0.8rem",
};

const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#e33232",
  color: "white",
  padding: "0.4rem 0.8rem",
  fontSize: "0.8rem",
};

const selectStyle = {
  padding: "0.6rem",
  borderRadius: "0.3rem",
  border: "1px solid #ced4da",
  fontSize: "0.9rem",
  transition: "border-color 0.3s ease",
  marginRight: "0.5rem",
};

const inputStyle = {
  padding: "0.6rem",
  borderRadius: "0.3rem",
  border: "1px solid #ced4da",
  fontSize: "0.9rem",
  marginBottom: "0.5rem",
};

const servicesContainerStyle = {
  margin: "1rem auto", // Centrer horizontalement
  border: "1px solid #ccc",
  padding: "1rem",
  borderRadius: "0.3rem",
  backgroundColor: "#f8f9fa",
  maxWidth: "600px", // Limiter la largeur si nécessaire
};

const serviceListStyle = {
  listStyleType: "none",
  padding: 0,
};

const serviceListItemStyle = {
  padding: "0.4rem 0",
  borderBottom: "1px solid #eee",
  fontSize: "0.9rem",
  textAlign: "center", // Centrer le texte de la liste des services
};

const manageServicesButtonStyle = {
  ...buttonStyle,
  padding: "0.4rem 0.8rem",
  fontSize: "0.8rem",
  backgroundColor: "#f8f9fa",
};

const addEditDeleteServiceButtonStyle = {
  ...buttonStyle,
  padding: "0.3rem 0.6rem",
  fontSize: "0.75rem",
};

const centeredContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "1.5rem",
};

const filterContainerStyle = {
  marginBottom: "1rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const filterLabelStyle = {
  fontSize: "0.9rem",
  marginBottom: "0.5rem",
};

const buttonsContainerStyle = {
  marginTop: "0.5rem",
  display: "flex",
  gap: "0.5rem",
};

const tableContainerStyle = {
  overflowX: "auto",
  width: "100%",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
};

const thStyle = {
  padding: "0.75rem",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
};

const trStyle = {
  borderBottom: "1px solid #ddd",
};

const tdStyle = {
  padding: "0.75rem",
  textAlign: "left",
};

export default function MedecinsList() {
  const [medecins, setMedecins] = useState([]);
  const [gardes, setGardes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("Tous");
  const [services, setServices] = useState(["Tous"]);
  const [showServices, setShowServices] = useState(false);
  const [allServices, setAllServices] = useState([
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
  ]);
  const [newService, setNewService] = useState("");
  const [serviceToEdit, setServiceToEdit] = useState("");
  const [editedService, setEditedService] = useState("");
  const [serviceToDelete, setServiceToDelete] = useState("");
  const router = useRouter();
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handlePrintButtonClick = () => {
    handlePrint();
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [medecinsRes, gardesRes] = await Promise.all([
          axios.get("/api/back/mod/article"),
          axios.get("http://localhost:3000/api/back/mod/garde"),
        ]);

        const medecinsData = medecinsRes.data?.members || [];
        const filteredMedecins = medecinsData.filter(
          (m) => m.role === "Médecin" || m.role === "Chef de service"
        );

        setMedecins(filteredMedecins);
        setGardes(gardesRes.data?.gardes || []);

        const uniqueServicesFromData = [
          "Tous",
          ...new Set(filteredMedecins.map((m) => m.service).filter(Boolean)),
        ];
        setServices(uniqueServicesFromData);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getGardeStats = (medecinId) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const medecinGardes = gardes.filter(
      (g) =>
        g.doctor?.toString() === medecinId?.toString() &&
        new Date(g.date).getMonth() === currentMonth &&
        new Date(g.date).getFullYear() === currentYear
    );

    return {
      count: medecinGardes.length,
      max: 5,
    };
  };

  const handleDelete = async (medecinId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce médecin ?")) return;

    try {
      await axios.delete(`/api/back/mod/article?id=${medecinId}`);
      setMedecins(medecins.filter((m) => m._id !== medecinId));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleAddService = () => {
    if (newService && !allServices.includes(newService)) {
      setAllServices([...allServices, newService]);
      setNewService("");
    } else if (allServices.includes(newService)) {
      alert("Ce service existe déjà.");
    } else {
      alert("Veuillez entrer un nom de service.");
    }
  };

  const handleEditService = () => {
    if (serviceToEdit && editedService) {
      const updatedServices = allServices.map(service =>
        service === serviceToEdit ? editedService : service
      );
      setAllServices(updatedServices);
      setServiceToEdit("");
      setEditedService("");
    } else {
      alert("Veuillez sélectionner un service à modifier et entrer le nouveau nom.");
    }
  };

  const handleDeleteService = () => {
    if (serviceToDelete) {
      const updatedServices = allServices.filter(service => service !== serviceToDelete);
      setAllServices(updatedServices);
      setServiceToDelete("");
    } else {
      alert("Veuillez sélectionner un service à supprimer.");
    }
  };

  const filteredMedecinsToRender = selectedService === "Tous"
    ? medecins
    : medecins.filter((m) => m.service === selectedService);

  if (loading) return <div>Chargement...</div>;
  if (medecins.length === 0 && !loading) return <div>Aucun médecin trouvé.</div>;

  return (
    <div style={centeredContainerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", width: "100%" }}>
        <button onClick={() => setShowServices(!showServices)} style={manageServicesButtonStyle}>
          {showServices ? "Masquer les Services" : "Afficher les Services"}
        </button>
        <button onClick={() => router.push('/front/superviseur')} style={secondaryButtonStyle}>
          Retour 
        </button>
      </div>

      {showServices && (
        <div style={servicesContainerStyle}>
          <h3>Gérer les Services</h3>
          <div>
            <h4>Ajouter un Service</h4>
            <input
              type="text"
              placeholder="Nom du service"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleAddService} style={addEditDeleteServiceButtonStyle}>Ajouter</button>
          </div>
          <div>
            <h4>Modifier un Service</h4>
            <select value={serviceToEdit} onChange={(e) => setServiceToEdit(e.target.value)} style={selectStyle}>
              <option value="">Sélectionner un service</option>
              {allServices.map((service, index) => (
                <option key={index} value={service}>{service}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nouveau nom"
              value={editedService}
              onChange={(e) => setEditedService(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleEditService} style={primaryButtonStyle}>Modifier</button>
          </div>
          <div>
            <h4>Supprimer un Service</h4>
            <select value={serviceToDelete} onChange={(e) => setServiceToDelete(e.target.value)} style={selectStyle}>
              <option value="">Sélectionner un service</option>
              {allServices.map((service, index) => (
                <option key={index} value={service}>{service}</option>
              ))}
            </select>
            <button onClick={handleDeleteService} style={addEditDeleteServiceButtonStyle}>Supprimer</button>
          </div>
          <h4 style={{ marginTop: "1rem", textAlign: "center" }}>Liste des Services Disponibles</h4>
          <ul style={serviceListStyle}>
            {allServices.map((service, index) => (
              <li key={index} style={serviceListItemStyle}>{service}</li>
            ))}
          </ul>
        </div>
      )}

      <h1 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Liste des Médecins</h1>

      <div style={filterContainerStyle}>
        <label style={filterLabelStyle}>Filtrer par service:</label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          style={selectStyle}
        >
          {services.map((service, index) => (
            <option key={index} value={service}>
              {service}
            </option>
          ))}
        </select>
        <div style={buttonsContainerStyle}>
          <Link href="/front/edit" passHref>
            <button style={primaryButtonStyle}>
              Ajouter un Médecin
            </button>
          </Link>
          <button onClick={handlePrintButtonClick} style={successButtonStyle}>
            Imprimer en PDF
          </button>
        </div>
      </div>

      <div ref={componentRef} style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Prénom</th>
              <th style={thStyle}>Service</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Gardes ce mois</th>
              <th style={thStyle}>Max/Mois</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedecinsToRender.map((medecin) => {
              const stats = getGardeStats(medecin._id);
              return (
                <tr key={medecin._id} style={trStyle}>
                  <td style={tdStyle}>{medecin.nom}</td>
                  <td style={tdStyle}>{medecin.prenom}</td>
                  <td style={tdStyle}>{medecin.service}</td>
                  <td style={tdStyle}>{medecin.role}</td>
                  <td style={{ ...tdStyle, color: stats.count >= stats.max ? "red" : "inherit" }}>{stats.count}</td>
                  <td style={tdStyle}>{stats.max}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => router.push(`/front/${medecin._id}`)}
                      style={{
                        ...buttonStyle,
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.8rem",
                        backgroundColor: "#3252e3",
                        color: "white",
                        marginRight: "0.3rem",
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(medecin._id)}
                      style={{
                        ...buttonStyle,
                        padding: "0.4rem 0.8rem",
                        fontSize: "0.8rem",
                        backgroundColor: "#e33232",
                        color: "white",
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}