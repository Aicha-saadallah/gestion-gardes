import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Planning() {
  const [events, setEvents] = useState([]);
  const [allGardes, setAllGardes] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [filtre, setFiltre] = useState("Toutes");
  const [selectedGarde, setSelectedGarde] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const gardeRes = await axios.get("http://localhost:3000/api/back/mod/garde");
        console.log("Réponse API garde:", gardeRes.data);

        const gardes = gardeRes.data?.gardes || [];

        const formatted = gardes.map((g) => ({
          id: g._id,
          title: `${g.nom} ${g.prenom} - ${g.specialite}`,
          start: g.date,
          end: g.date,
          allDay: true,
          specialite: g.specialite
        }));

        setAllGardes(formatted);
        setEvents(formatted);

        // Extraire les spécialités uniques
        const uniqueSpecialites = [...new Set(gardes.map((garde,index1) => garde.specialite))];
        setSpecialites(["Toutes", ...uniqueSpecialites]);

        // Récupérer la liste des médecins disponibles
        const memberRes = await axios.get("/api/back/mod/articleSchemaDB");
        setMembers(memberRes.data?.members || []);
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (filtre === "Toutes") {
      setEvents(allGardes);
    } else {
      setEvents(allGardes.filter((garde) => garde.specialite === filtre));
    }
  }, [filtre, allGardes]);

  const handleEventClick = (info) => {
    const event = allGardes.find((garde) => garde.id === info.event.id);
    if (event) setSelectedGarde(event);
  };

  const handleGiveGarde = async (memberId) => {
    if (!memberId || !selectedGarde) return;

    try {
      await axios.post("/api/back/mod/gardeSchema", {
        gardeId: selectedGarde.id,
        memberId: memberId
      });

      // Mettre à jour le titre visuellement
      const updatedEvents = events.map((event) =>
        event.id === selectedGarde.id
          ? {
              ...event,
              title: `Transférée - ${event.specialite}`
            }
          : event
      );

      setEvents(updatedEvents);
      setAllGardes(updatedEvents);
      setSelectedGarde(null);
    } catch (err) {
      console.error("Erreur lors du transfert de la garde :", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ textAlign: "center" }}>📅 Planning des Gardes</h1>

      <div style={{ margin: "1rem 0", textAlign: "center" }}>
        <label>Filtrer par spécialité : </label>
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
          {specialites.map((s, idx) => (
            <option key={idx} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        events={events}
        height="auto"
        eventClick={handleEventClick}
      />

      {selectedGarde && (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd" }}>
          <h3>Garde sélectionnée : {selectedGarde.title}</h3>
          <p>
            Date :{" "}
            {new Date(selectedGarde.start).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </p>
          <p>Spécialité : {selectedGarde.specialite}</p>

          <h4>Choisir un médecin pour transfert :</h4>
          <select onChange={(e) => handleGiveGarde(e.target.value)} defaultValue="">
            <option value="" disabled>-- Sélectionner un médecin --</option>
            {members.map((m, idx) => (
              <option key={idx} value={m._id}>{m.nom} {m.prenom}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
