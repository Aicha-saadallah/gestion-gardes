// front/echange.js
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import Link from 'next/link';
import { useRouter } from "next/router";
import styles from "@/styles/medecin.module.css";
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Date invalide";
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

// Composant pour le panneau d'échange
function ExchangePanel({
    selectedGardes,
    allGardes,
    exchangeMessage,
    setExchangeMessage,
    router,
    loadingData
}) {
    const handleExchangeProposal = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user) {
                console.error("Utilisateur non authentifié.");
                return;
            }
            const fromDoctor = user._id || user.id;

            if (selectedGardes.length === 0) {
                alert("Veuillez sélectionner au moins une garde.");
                return;
            }

            // Pour cet exemple, nous prenons le médecin de la première garde sélectionnée comme destinataire.
            // Dans une application réelle, vous devrez peut-être permettre à l'utilisateur de choisir le destinataire.
            const firstSelectedGarde = allGardes.find(g => selectedGardes[0] === g.id);
            const toDoctor = firstSelectedGarde?.doctorId;

            const response = await axios.post('/api/back/mod/exchange', {
                gardeIds: selectedGardes,
                fromDoctor: fromDoctor,
                toDoctor: toDoctor,
                message: exchangeMessage,
                status: 'en attente'
            });

            if (response.status === 201) {
                console.log("Demande d'échange envoyée avec succès pour les gardes sélectionnées!");
                router.push('/front/EchangeModel');
            } else {
                console.error("Échec de l'envoi de la demande d'échange:", response.data);
                alert("Échec de l'envoi de la demande d'échange.");
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi de la demande d'échange:", error);
            alert("Erreur lors de l'envoi de la demande d'échange.");
        }
    };

    return (
        <div className={styles.exchangePanel}>
            <h3 className={styles.exchangeTitle}>Proposer un échange de gardes</h3>
            {loadingData ? (
                <Spinner animation="border" size="sm" />
            ) : (
                <>
                    <div className={styles.exchangeSummary}>
                        <p>Gardes sélectionnées pour l'échange : <strong>{selectedGardes.length}</strong></p>
                        {selectedGardes.length > 0 && (
                            <ul className={styles.selectedGardesList}>
                                {selectedGardes.map(gardeId => {
                                    const garde = allGardes.find(g => g.id === gardeId);
                                    return garde ? (
                                        <li key={gardeId}>
                                            {garde.prenom} {garde.nom} - {formatDate(garde.start)}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        )}
                    </div>

                    {selectedGardes.length > 0 && (
                        <div className={styles.exchangeForm}>
                            <label htmlFor="exchangeMessage" className={styles.exchangeLabel}>
                                Message d'échange :
                            </label>
                            <textarea
                                id="exchangeMessage"
                                className={styles.exchangeTextarea}
                                value={exchangeMessage}
                                onChange={(e) => setExchangeMessage(e.target.value)}
                                placeholder="Décrivez les détails de l'échange..."
                            />
                            <Button
                                variant="primary"
                                className={styles.exchangeButton}
                                onClick={handleExchangeProposal}
                            >
                                Envoyer la demande d'échange
                            </Button>
                        </div>
                    )}
                    {selectedGardes.length === 0 && (
                        <p className={styles.exchangeHint}>
                            Sélectionnez des gardes en cliquant sur les dates du calendrier pour proposer un échange.
                        </p>
                    )}
                    <Link href="/front/EchangeModel" className={styles.linkButton}>
                        Voir les demandes d'échange
                    </Link>
                </>
            )}
        </div>
    );
}

// Composant pour les détails de la garde dans la modal
function GardeDetailsModal({
    showModal,
    setShowModal,
    selectedGardeDetails,
    selectedGardes,
    setSelectedGardes,
    userData,
    formatDate
}) {
    const toggleGardeSelection = () => {
        if (!selectedGardeDetails?.id || selectedGardeDetails.isMine) return;

        setSelectedGardes(prevSelected => {
            const isSelected = prevSelected.includes(selectedGardeDetails.id);
            return isSelected
                ? prevSelected.filter(id => id !== selectedGardeDetails.id)
                : [...prevSelected, selectedGardeDetails.id];
        });
    };

    return (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton className={styles.modalHeader}>
                <Modal.Title>
                    Garde du {selectedGardeDetails && formatDate(selectedGardeDetails.start)}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedGardeDetails && (
                    <div className={styles.gardeModalContent}>
                        <div className={styles.gardeInfo}>
                            <p><strong>Service :</strong> {selectedGardeDetails.service}</p>
                            <p><strong>Médecin :</strong> {selectedGardeDetails.prenom} {selectedGardeDetails.nom}</p>
                            <p>
                                <strong>Votre garde :</strong>
                                <span className={selectedGardeDetails.isMine ? styles.yesText : styles.noText}>
                                    {selectedGardeDetails.isMine ? 'Oui' : 'Non'}
                                </span>
                            </p>
                            {!selectedGardeDetails.isMine && (
                                <p>
                                    <strong>Sélectionnée pour l'échange :</strong>
                                    <span className={selectedGardes.includes(selectedGardeDetails.id) ? styles.yesText : styles.noText}>
                                        {selectedGardes.includes(selectedGardeDetails.id) ? 'Oui' : 'Non'}
                                    </span>
                                </p>
                            )}
                        </div>

                        <hr className={styles.divider} />

                        <div className={styles.actionSection}>
                            <h5 className={styles.sectionTitle}>Actions :</h5>
                            <div className={styles.actionButtons}>
                                {!selectedGardeDetails.isMine && (
                                    <Button
                                        variant={selectedGardes.includes(selectedGardeDetails.id) ? "info" : "outline-info"}
                                        className={styles.actionButton}
                                        onClick={toggleGardeSelection}
                                    >
                                        {selectedGardes.includes(selectedGardeDetails.id)
                                            ? "Désélectionner pour l'échange"
                                            : "Sélectionner pour l'échange"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default function Planning() {
    const [events, setEvents] = useState([]);
    const [allGardes, setAllGardes] = useState([]);
    const [userData, setUserData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedGardes, setSelectedGardes] = useState([]);
    const [selectedGardeDetails, setSelectedGardeDetails] = useState(null);
    const [exchangeMessage, setExchangeMessage] = useState("J'aimerais échanger mes gardes du ");
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/front/login");
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            setUserData(user);
        } else {
            router.push("/front/login");
        }
    }, [router]);

    useEffect(() => {
        async function fetchData() {
            if (!userData) return;

            try {
                setLoadingData(true);
                setError(null);
                const myId = String(userData._id || userData.id);

                const gardeRes = await axios.get("/api/back/mod/garde", {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                let gardes = gardeRes.data?.gardes || [];

                if (["Médecin", "Chef de service"].includes(userData.role)) {
                    gardes = gardes.filter(garde => garde.service === userData.service);
                }

                const formattedGardes = gardes.map((g) => ({
                    id: g._id,
                    title: `${g.nom} ${g.prenom} - ${g.service}`,
                    start: g.date,
                    end: g.date,
                    allDay: true,
                    service: g.service,
                    nom: g.nom,
                    prenom: g.prenom,
                    doctorId: g.doctor,
                    isMine: String(g.doctor) === myId,
                }));

                setAllGardes(formattedGardes);
                setEvents(formattedGardes);

            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError("Erreur lors du chargement des données. Veuillez réessayer.");
            } finally {
                setLoadingData(false);
            }
        }

        fetchData();
    }, [userData]);

    const handleEventClick = (info) => {
        const gardeId = info.event.id;
        const clickedGarde = allGardes.find(garde => garde.id === gardeId);

        if (clickedGarde && !clickedGarde.isMine) {
            setSelectedGardes((prevSelected) => {
                const isAlreadySelected = prevSelected.includes(gardeId);
                const updatedSelected = isAlreadySelected
                    ? prevSelected.filter(id => id !== gardeId)
                    : [...prevSelected, gardeId];

                // Mise à jour du message en fonction des gardes sélectionnées
                if (updatedSelected.length > 0) {
                    const dates = updatedSelected
                        .map(id => allGardes.find(g => g.id === id)?.start)
                        .filter(date => date)
                        .map(formatDate);
                    setExchangeMessage(`J'aimerais échanger mes gardes du ${dates.join(', ')}`);
                } else {
                    setExchangeMessage("J'aimerais échanger mes gardes du ");
                }
                return updatedSelected;
            });
        }

        setSelectedGardeDetails(clickedGarde);
        setShowModal(true);
    };

    const renderEventContent = (eventInfo) => {
        const isSelected = selectedGardes.includes(eventInfo.event.id);
        const isMine = eventInfo.event.extendedProps.isMine;

        const style = {
            backgroundColor: isMine ? 'lightgreen' : isSelected ? 'lightblue' : '',
            padding: '5px',
            borderRadius: '3px',
            cursor: 'pointer',
            border: isSelected ? '2px solid blue' : '1px solid #ccc',
            opacity: isMine && !isSelected ? 0.7 : 1
        };

        return (
            <div style={style}>
                <strong>{eventInfo.event.title}</strong>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.navigationButtons}>
                    <Link href="/front/medecin" className={styles.backButton}>
                        Retour au Planning
                    </Link>
                </div>
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Déconnexion
                </button>
            </div>

            <h2 className={styles.subtitle}>Proposer un échange</h2>

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {loadingData ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p>Chargement du planning...</p>
                </div>
            ) : (
                <div className={styles.mainContent}>
                    <ExchangePanel
                        selectedGardes={selectedGardes}
                        allGardes={allGardes}
                        exchangeMessage={exchangeMessage}
                        setExchangeMessage={setExchangeMessage}
                        router={router}
                        loadingData={loadingData}
                    />

                    <div className={styles.calendarContainer}>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale="fr"
                            events={events}
                            height="auto"
                            eventClick={handleEventClick}
                            eventContent={renderEventContent}
                            headerToolbar={{
                                start: 'title',
                                center: '',
                                end: 'prev,next today'
                            }}
                        />
                    </div>
                </div>
            )}

            <GardeDetailsModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedGardeDetails={selectedGardeDetails}
                selectedGardes={selectedGardes}
                setSelectedGardes={setSelectedGardes}
                userData={userData}
                formatDate={formatDate}
            />
        </div>
    );
}