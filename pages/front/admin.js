import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/router';
import styles from '@/styles/planning.module.css'; // Importez un fichier CSS pour le style

export default function Planning() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [allGardes, setAllGardes] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [filtre, setFiltre] = useState("Toutes");
    const [selectedGarde, setSelectedGarde] = useState(null);
    const [members, setMembers] = useState([]);
    const [registrationRequests, setRegistrationRequests] = useState([]); // Pour stocker les demandes d'inscription
    const [showRequests, setShowRequests] = useState(false);
    const [isSuperviseurUser, setIsSuperviseurUser] = useState(false);
    const [notifications, setNotifications] = useState([]); // Pour stocker d'autres notifications
    const [showNotifications, setShowNotifications] = useState(false);

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

                // Extraire les spécialités uniques
                const uniqueSpecialites = [...new Set(gardes.map((garde) => garde.service))];
                setSpecialites(["Toutes", ...uniqueSpecialites]);

                // Récupérer la liste des médecins disponibles
                const memberRes = await axios.get("/api/back/mod/articleSchemaDB");
                setMembers(memberRes.data?.members || []);

                // Determine if the user is a supervisor client-side and fetch requests/notifications
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const decodedToken = JSON.parse(atob(token.split('.')[1]));
                            setIsSuperviseurUser(decodedToken.role === 'Superviseur');
                            if (decodedToken.role === 'Superviseur') {
                                // Récupérer les demandes d'administrateur et d'utilisateur
                                const adminRequestRes = await axios.get("/api/back/mod/approval?role=Administrateur&status=pending");
                                const userRequestRes = await axios.get("/api/back/mod/approval?role=User&status=pending");
                                setRegistrationRequests([...(adminRequestRes.data?.users || []), ...(userRequestRes.data?.users || [])]);

                                // Récupérer d'autres notifications (adapter l'API selon votre besoin)
                                const notificationRes = await axios.get("/api/back/mod/notifications");
                                setNotifications(notificationRes.data?.notifications || []);
                            }
                        } catch (error) {
                            console.error("Erreur lors de la lecture du token :", error);
                        }
                    }
                }

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
        router.push('/front/MedecinsListt');
    };

    const handleLogout = () => {
        router.push('/front/login');
    };

    const handleToggleRequests = () => {
        setShowRequests(!showRequests);
    };

    const handleAcceptRequest = async (userId) => {
        try {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (!token) return;
                const decodedToken = JSON.parse(atob(token.split('.')[1]));

                await axios.put("/api/back/mod/approval", {
                    id: userId,
                    action: "approve",
                    approverId: decodedToken.id // L'ID du superviseur connecté
                });
                // Mettre à jour la liste des demandes après l'approbation
                setRegistrationRequests(registrationRequests.filter(req => req._id !== userId));
            }
        } catch (error) {
            console.error("Erreur lors de l'acceptation de la demande :", error);
        }
    };

    const handleRejectRequest = async (userId) => {
        try {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (!token) return;
                const decodedToken = JSON.parse(atob(token.split('.')[1]));

                await axios.put("/api/back/mod/approval", {
                    id: userId,
                    action: "reject",
                    approverId: decodedToken.id // L'ID du superviseur connecté
                });
                // Mettre à jour la liste des demandes après le rejet
                setRegistrationRequests(registrationRequests.filter(req => req._id !== userId));
            }
        } catch (error) {
            console.error("Erreur lors du rejet de la demande :", error);
        }
    };

    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    return (
        <div className={styles.planningContainer}>
            <div className={styles.header}>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Déconnexion
                </button>
                <button onClick={handleOpenMedecinsList} className={styles.medecinsButton}>
                    Liste des Médecins
                </button>
                {isSuperviseurUser && (
                    <>
                        <div className={styles.notificationContainer}>
                            <button onClick={handleToggleRequests} className={styles.notificationButton}>
                                Demandes ({registrationRequests.length})
                            </button>
                            {showRequests && (
                                <div className={styles.notificationDropdown}>
                                    {registrationRequests.length > 0 ? (
                                        <ul>
                                            {registrationRequests.map(request => (
                                                <li key={request._id}>
                                                    {request.nom} {request.prenom} ({request.email}) - Demande d'inscription
                                                    <button onClick={() => handleAcceptRequest(request._id)} className={styles.acceptButton}>Accepter</button>
                                                    <button onClick={() => handleRejectRequest(request._id)} className={styles.rejectButton}>Refuser</button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Aucune nouvelle demande.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.notificationContainer}>
                            <button onClick={handleToggleNotifications} className={styles.notificationButton}>
                                Notifications ({notifications.length})
                            </button>
                            {showNotifications && (
                                <div className={styles.notificationDropdown}>
                                    {notifications.length > 0 ? (
                                        <ul>
                                            {notifications.map(notification => (
                                                <li key={notification._id}>
                                                    {notification.message} {/* Assurez-vous que votre objet notification a une propriété 'message' */}
                                                    {/* Vous pouvez ajouter d'autres détails ou actions pour chaque notification */}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Aucune nouvelle notification.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
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