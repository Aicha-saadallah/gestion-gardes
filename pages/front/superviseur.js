// pages/front/Planning.js
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/router';
import styles from '@/styles/planning.module.css';

export default function Planning() {
    const router = useRouter();
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
                    title: `${g.nom} ${g.prenom} - ${g.service}`,
                    start: g.date,
                    end: g.date,
                    allDay: true,
                    service: g.service
                }));

                setAllGardes(formatted);
                setEvents(formatted);

                const uniqueSpecialites = [...new Set(gardes.map((garde) => garde.service))];
                setSpecialites(["Toutes", ...uniqueSpecialites]);

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
            setEvents(allGardes.filter((garde) => garde.service === filtre));
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

            const updatedEvents = events.map((event) =>
                event.id === selectedGarde.id
                    ? { ...event, title: `Transférée - ${event.service}` }
                    : event
            );

            setEvents(updatedEvents);
            setAllGardes(updatedEvents);
            setSelectedGarde(null);
        } catch (err) {
            console.error("Erreur lors du transfert de la garde :", err);
        }
    };

    const handleOpenMedecinsList = () => {
        router.push('/front/MedecinsList');
    };

    const handleOpenAdminList = () => {
        router.push('/front/adminList');
    };

    const handleLogout = () => {
        router.push('/front/login');
    };

    return (
        <div className={styles.planningContainer}>
            <div className={styles.header}>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Déconnexion
                </button>
                
                <div className={styles.actionButtons}>
                    <button onClick={handleOpenMedecinsList} className={styles.medecinsButton}>
                        Liste des Médecins
                    </button>
                    <button onClick={handleOpenAdminList} className={styles.adminButton}>
                    Liste des Admin
                    </button>
                </div>
            </div>

            <h1 className={styles.title}>📅 Planning des Gardes</h1>

            <div className={styles.filter}>
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
                <div className={styles.selectedGarde}>
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
                    <p>Spécialité : {selectedGarde.service}</p>

                    <h4>Proposer un transfert à :</h4>
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