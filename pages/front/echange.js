import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import Link from 'next/link';
import { useRouter } from "next/router";
import styles from "@/styles/medecin.module.css"; // Assurez-vous que ce chemin est correct
import { Modal, Button, Alert, Spinner, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; // Assurez-vous d'importer le CSS de Bootstrap

// Helper pour formater la date de manière lisible
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
        ? "Date invalide"
        : date.toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
};

// --- Composant Panel d'Échange ---
const ExchangePanel = ({
    selectedGardesToGet,
    selectedGardesToGive,
    allGardes, // Toutes les gardes disponibles (avec les détails du médecin)
    exchangeMessage,
    setExchangeMessage,
    loadingData,
    onProposeExchange, // Fonction pour envoyer la proposition
    setError // Fonction pour définir un message d'erreur dans le parent
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setError(null); // Effacer les erreurs précédentes avant une nouvelle tentative

        if (selectedGardesToGet.length === 0 || selectedGardesToGive.length === 0) {
            setError("Veuillez sélectionner au moins une garde à obtenir et une garde à donner pour proposer un échange.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onProposeExchange(); // Appelle la fonction passée par le parent (qui gère l'appel API et la réinitialisation)
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour obtenir les noms des médecins des gardes à obtenir
    const getDoctorsInvolved = () => {
        const doctors = new Set();
        selectedGardesToGet.forEach(gardeId => {
            const garde = allGardes.find(g => g.id === gardeId);
            if (garde && garde.prenom && garde.nom) {
                 doctors.add(`${garde.prenom} ${garde.nom}`);
            }
        });
        return Array.from(doctors).join(", ") || "Aucun médecin concerné identifié";
    };

    return (
        <div className={styles.exchangePanel}>
            <h3 className={styles.exchangeTitle}>Proposer un échange</h3>

            {loadingData ? (
                <div className="text-center">
                    <Spinner animation="border" size="sm" />
                    <p>Chargement des données...</p>
                </div>
            ) : (
                <>
                    <div className="mb-3">
                        <h5>Mes gardes à donner <span className="badge bg-primary">{selectedGardesToGive.length}</span></h5>
                        {selectedGardesToGive.length > 0 ? (
                            <ul className={styles.selectedGardesList}>
                                {selectedGardesToGive.map(gardeId => {
                                    const garde = allGardes.find(g => g.id === gardeId);
                                    return garde ? (
                                        <li key={gardeId}>
                                            {formatDate(garde.start)} - {garde.service}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        ) : (
                            <p className="text-muted">Aucune de vos gardes sélectionnée pour donner.</p>
                        )}
                    </div>

                    <div className="mb-3">
                        <h5>Gardes à obtenir <span className="badge bg-success">{selectedGardesToGet.length}</span></h5>
                        {selectedGardesToGet.length > 0 ? (
                            <>
                                <ul className={styles.selectedGardesList}>
                                    {selectedGardesToGet.map(gardeId => {
                                        const garde = allGardes.find(g => g.id === gardeId);
                                        return garde ? (
                                            <li key={gardeId}>
                                                {formatDate(garde.start)} - {garde.service} ({garde.prenom} {garde.nom})
                                            </li>
                                        ) : null;
                                    })}
                                </ul>
                                <p className="mt-2">
                                    <strong>Médecin(s) concerné(s) :</strong> {getDoctorsInvolved()}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted">Aucune garde d'autres médecins sélectionnée pour obtenir.</p>
                        )}
                    </div>

                    <div className="mb-3">
                        <Form.Label htmlFor="exchangeMessage">Message pour l'échange</Form.Label>
                        <Form.Control
                            id="exchangeMessage"
                            as="textarea"
                            rows={4}
                            value={exchangeMessage}
                            onChange={(e) => setExchangeMessage(e.target.value)}
                            placeholder="Ex: Bonjour, je propose d'échanger ma garde du 15/06 contre celle du 20/06. Cordialement."
                        />
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        // Le bouton est désactivé si en cours de soumission ou si des sélections sont manquantes
                        disabled={isSubmitting || selectedGardesToGet.length === 0 || selectedGardesToGive.length === 0}
                        className="w-100"
                    >
                        {isSubmitting ? (
                            <><Spinner animation="border" size="sm" /> Envoi en cours...</>
                        ) : (
                            "Envoyer la demande d'échange"
                        )}
                    </Button>

                    <div className="mt-3">
                        <Link href="/front/EchangeModel" className="btn btn-outline-secondary w-100">
                            Voir mes demandes d'échange
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Composant Modale des détails de Garde ---
const GardeDetailsModal = ({
    show,
    onHide,
    garde, // La garde complète (avec isMine)
    isSelectedToGet, // Indique si cette garde est déjà sélectionnée pour 'obtenir'
    isSelectedToGive, // Indique si cette garde est déjà sélectionnée pour 'donner'
    onToggleSelection // Fonction pour ajouter/retirer la garde des sélections
}) => {
    if (!garde) return null; // Ne rien afficher si aucune garde n'est sélectionnée

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Détails de la garde</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p><strong>Date :</strong> {formatDate(garde.start)}</p>
                <p><strong>Service :</strong> {garde.service}</p>
                <p><strong>Médecin :</strong> {garde.prenom} {garde.nom}</p>

                <div className="mt-4 d-flex gap-2">
                    {/* Bouton pour ajouter/retirer des gardes à obtenir (autres médecins) */}
                    {!garde.isMine && ( // N'afficher ce bouton que si ce n'est PAS ma garde
                        <Button
                            variant={isSelectedToGet ? "danger" : "primary"}
                            onClick={() => onToggleSelection(garde, 'get')}
                        >
                            {isSelectedToGet ? "Retirer des gardes à obtenir" : "Ajouter aux gardes à obtenir"}
                        </Button>
                    )}

                    {/* Bouton pour ajouter/retirer des gardes à donner (mes gardes) */}
                    {garde.isMine && ( // N'afficher ce bouton que si c'est MA garde
                        <Button
                            variant={isSelectedToGive ? "danger" : "success"}
                            onClick={() => onToggleSelection(garde, 'give')}
                        >
                            {isSelectedToGive ? "Retirer des gardes à donner" : "Ajouter aux gardes à donner"}
                        </Button>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Composant principal de la page d'échange ---
export default function ExchangePage() {
    const router = useRouter();
    const [events, setEvents] = useState([]); // Données formatées pour FullCalendar
    const [allGardes, setAllGardes] = useState([]); // Toutes les gardes avec leurs détails étendus
    const [userData, setUserData] = useState(null); // Informations de l'utilisateur connecté
    const [selectedGardesToGet, setSelectedGardesToGet] = useState([]); // IDs des gardes à obtenir
    const [selectedGardesToGive, setSelectedGardesToGive] = useState([]); // IDs des gardes à donner
    const [selectedGarde, setSelectedGarde] = useState(null); // Garde actuellement sélectionnée dans la modale
    const [exchangeMessage, setExchangeMessage] = useState(""); // Message de l'échange
    const [loading, setLoading] = useState(true); // État de chargement initial
    const [error, setError] = useState(null); // État pour les messages d'erreur à afficher

    // Chargement initial des données : utilisateur et gardes
    useEffect(() => {
        const loadData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user"));
                // --- Débogage: Vérifiez ce qui est récupéré de localStorage ---
                console.log("User data from localStorage:", user);

                if (!user) {
                    router.push("/front/login"); // Rediriger si pas connecté
                    return;
                }
                setUserData(user);
                // --- Débogage: Vérifiez userData après l'avoir défini ---
                console.log("userData set in state:", user);
                if (user && user._id) {
                    console.log("userData._id:", user._id);
                } else if (user && user.id) {
                    console.log("userData.id (fallback):", user.id);
                } else {
                    console.log("userData has no _id or id property.");
                }


                const response = await axios.get("/api/back/mod/garde");
                const gardes = response.data?.gardes || [];

                // Formater les gardes pour FullCalendar et pour l'état `allGardes`
                const formattedGardes = gardes
                    .filter(g => user.role === "admin" || g.service === user.service) // Filtrer par service de l'utilisateur ou tout afficher pour les admins
                    .map(g => ({
                        id: g._id,
                        title: `${g.prenom} ${g.nom} - ${g.service}`,
                        start: g.date,
                        end: g.date,
                        allDay: true,
                        service: g.service,
                        nom: g.nom,
                        prenom: g.prenom,
                        doctorId: g.doctor, // ID du médecin propriétaire de cette garde
                        isMine: g.doctor.toString() === (user._id || user.id).toString() // Vérifie si c'est la garde de l'utilisateur connecté
                    }));

                setAllGardes(formattedGardes); // Gardes complètes avec tous les détails
                setEvents(formattedGardes); // Gardes formatées pour le calendrier
                setLoading(false);
            } catch (err) {
                console.error("Erreur de chargement des données:", err);
                setError("Erreur de chargement des données. Veuillez réessayer.");
                setLoading(false);
            }
        };

        loadData();
    }, [router]); // `router` comme dépendance pour recharger si la route change (bien que peu probable ici)

    // Gérer le clic sur un événement (garde) du calendrier
    const handleEventClick = (info) => {
        const garde = allGardes.find(g => g.id === info.event.id);
        if (garde) {
            setSelectedGarde(garde); // Ouvre la modale avec les détails de la garde
        }
    };

    // Basculer la sélection d'une garde (pour obtenir ou donner)
    const toggleGardeSelection = (garde, type) => {
        // Fermer la modale après la sélection/désélection pour une meilleure UX
        setSelectedGarde(null);
        setError(null); // Effacer toute erreur précédente pour cette action

        if (type === 'get') { // L'utilisateur veut obtenir cette garde
            if (garde.isMine) {
                setError("Vous ne pouvez pas demander vos propres gardes. Sélectionnez une garde d'un autre médecin.");
                return;
            }
            if (selectedGardesToGive.includes(garde.id)) {
                setError("Une garde ne peut pas être à la fois 'à donner' et 'à obtenir'.");
                return;
            }

            setSelectedGardesToGet(prev => {
                const isSelected = prev.includes(garde.id);
                return isSelected
                    ? prev.filter(id => id !== garde.id) // Désélectionner
                    : [...prev, garde.id]; // Sélectionner
            });
        } else { // type === 'give' - L'utilisateur veut donner cette garde
            if (!garde.isMine) {
                setError("Vous ne pouvez donner que vos propres gardes.");
                return;
            }
            if (selectedGardesToGet.includes(garde.id)) {
                setError("Une garde ne peut pas être à la fois 'à donner' et 'à obtenir'.");
                return;
            }

            setSelectedGardesToGive(prev => {
                const isSelected = prev.includes(garde.id);
                return isSelected
                    ? prev.filter(id => id !== garde.id) // Désélectionner
                    : [...prev, garde.id]; // Sélectionner
            });
        }
    };

    // Réinitialiser toutes les sélections et le message après soumission ou annulation
    const resetExchangeSelections = () => {
        setSelectedGardesToGet([]);
        setSelectedGardesToGive([]);
        setExchangeMessage("");
        setSelectedGarde(null); // S'assurer que la modale est fermée
        setError(null); // Effacer les messages d'erreur
    };

    // Gérer l'envoi de la demande d'échange au backend
    const handleProposeExchange = async () => {
        setError(null); // Réinitialiser l'erreur avant l'appel API

        // --- Débogage: Vérifiez userData et son _id juste avant l'envoi ---
        console.log("userData au moment de la soumission dans handleProposeExchange:", userData);
        if (!userData || (!userData._id && !userData.id)) { // Vérifier les deux _id et id
            console.error("Erreur: userData ou userData._id/id est manquant/invalide. Redirection vers la page de connexion.");
            setError('ID utilisateur manquant. Veuillez vous reconnecter.');
            router.push("/front/login"); // Rediriger si l'ID est manquant
            return; // Arrêter l'exécution
        }

        const fromDoctorId = userData._id || userData.id; // Utiliser _id en priorité, sinon id

        try {
            const response = await axios.post('/api/back/mod/exchange', {
                gardesToGet: selectedGardesToGet,
                gardesToGive: selectedGardesToGive,
                fromDoctor: fromDoctorId, // Utiliser l'ID du médecin correctement récupéré
                message: exchangeMessage
            });

            if (response.data.success) {
                alert(response.data.message); // Utiliser une alerte pour le succès
                resetExchangeSelections(); // Réinitialiser le formulaire après succès
                // Optionnel : Recharger les gardes ici si la vue doit être mise à jour immédiatement
                // Par exemple, si l'échange est accepté instantanément (ce qui n'est pas le cas ici)
            }
        } catch (error) {
            console.error('Erreur lors de la proposition d\'échange:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Erreur inconnue lors de la proposition de l\'échange. Vérifiez la console.');
        }
    };

    // Personnaliser l'affichage des événements dans le calendrier
    const renderEventContent = (eventInfo) => {
        const isSelectedToGet = selectedGardesToGet.includes(eventInfo.event.id);
        const isSelectedToGive = selectedGardesToGive.includes(eventInfo.event.id);
        const isMine = eventInfo.event.extendedProps.isMine; // Récupère la propriété `isMine`

        return (
            <div className={`event-content
                ${isMine ? styles.myEvent : styles.otherEvent}
                ${isSelectedToGet ? styles.selectedToGet : ''}
                ${isSelectedToGive ? styles.selectedToGive : ''}`}
            >
                <div className={styles.eventTitle}>{eventInfo.event.title}</div>
                <div className={styles.eventDate}>
                    {new Date(eventInfo.event.start).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                    })}
                </div>
            </div>
        );
    };

    // Affichage d'un spinner pendant le chargement initial
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline-secondary" onClick={() => router.push('/front/medecin')}>
                    Retour au planning
                </Button>
                <Button variant="outline-danger" onClick={() => {
                    localStorage.removeItem("user"); // Déconnexion
                    router.push('/front/login');
                }}>
                    Déconnexion
                </Button>
            </header>

            <main className={styles.main}>
                <h2 className={styles.title}>Proposer un échange de gardes</h2>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible className="my-3">
                        {error}
                    </Alert>
                )}

                <div className={styles.content}>
                    <ExchangePanel
                        selectedGardesToGet={selectedGardesToGet}
                        selectedGardesToGive={selectedGardesToGive}
                        allGardes={allGardes}
                        exchangeMessage={exchangeMessage}
                        setExchangeMessage={setExchangeMessage}
                        loadingData={loading}
                        userData={userData} // Passer userData au panel si besoin (pour l'ID du médecin)
                        onProposeExchange={handleProposeExchange} // Passer la fonction d'envoi
                        setError={setError} // Passer la fonction setError pour les erreurs spécifiques au panel
                    />

                    <div className={styles.calendar}>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale="fr" // Calendrier en français
                            events={events} // Les données des événements à afficher
                            eventClick={handleEventClick} // Gérer le clic sur un événement
                            eventContent={renderEventContent} // Personnaliser le contenu de l'événement
                            headerToolbar={{
                                start: 'title', // Titre du mois
                                center: '',
                                end: 'prev,next today' // Boutons de navigation
                            }}
                            height="auto" // Hauteur auto pour s'adapter au contenu
                        />
                    </div>
                </div>
            </main>

            {/* Modale des détails de la garde, affichée lorsque `selectedGarde` n'est pas null */}
            <GardeDetailsModal
                show={!!selectedGarde} // true si selectedGarde n'est pas null
                onHide={() => setSelectedGarde(null)} // Fermer la modale
                garde={selectedGarde}
                isSelectedToGet={selectedGarde ? selectedGardesToGet.includes(selectedGarde.id) : false}
                isSelectedToGive={selectedGarde ? selectedGardesToGive.includes(selectedGarde.id) : false}
                onToggleSelection={toggleGardeSelection}
            />
        </div>
    );
}