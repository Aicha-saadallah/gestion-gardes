// front/medecin.js
import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { useRouter } from "next/router";
import styles from "@/styles/medecin.module.css";
import Link from "next/link";
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Planning() {
    const [events, setEvents] = useState([]);
    const [allGardes, setAllGardes] = useState([]);
    const [members, setMembers] = useState([]);
    const [userData, setUserData] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [selectedGarde, setSelectedGarde] = useState(null);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedMedecinId, setSelectedMedecinId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [medecinSearch, setMedecinSearch] = useState('');
    const [showMedecinList, setShowMedecinList] = useState(false);
    const calendarRef = useRef(null);
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
                    backgroundColor: String(g.doctor) === myId ? 'lightblue' : '',
                    borderColor: String(g.doctor) === myId ? 'blue' : ''
                }));

                setAllGardes(formattedGardes);

                const filteredEvents = activeFilter === "my"
                    ? formattedGardes.filter(garde => String(garde.doctorId) === myId)
                    : formattedGardes;

                setEvents(filteredEvents);

                if (userData?.service) {
                    const query = new URLSearchParams({
                        service: userData.service,
                        currentUserId: myId
                    }).toString();
                    const memberRes = await axios.get(`/api/back/mod/medecinGarde?${query}`, {
                        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                    });

                    if (memberRes.data?.success && memberRes.data?.data?.members) {
                        setMembers(memberRes.data.data.members || []);
                    } else {
                        console.error("Failed to load members:", memberRes.data);
                        setMembers([]);
                    }
                }
            } catch (err) {
                console.error("Data loading error:", err);
                setError("Erreur lors du chargement des données. Veuillez réessayer.");
            } finally {
                setLoadingData(false);
            }
        }

        fetchData();
    }, [userData, activeFilter]);

    const handleEventClick = (info) => {
        const event = allGardes.find((garde) => garde.id === info.event.id);
        if (event) {
            setSelectedGarde(event);
            setShowModal(true);
        }
    };

    const handleGiveGarde = () => {
        setShowModal(false);
        setShowExchangeModal(true);
    };

    const handleSelectMedecin = (medecin) => {
        setSelectedMedecinId(medecin.id);
        setMedecinSearch(`${medecin.prenom} ${medecin.nom}`);
        setShowMedecinList(false);
    };

    const handleExchangeSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGarde || !selectedMedecinId) {
            setError("Veuillez sélectionner un médecin pour l'échange");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await axios.post("/api/back/mod/exchange", {
                originalGardeId: selectedGarde.id,
                requestedDoctorId: selectedMedecinId,
                message
            });

            setSuccess("Proposition d'échange envoyée avec succès");
            setTimeout(() => {
                setShowExchangeModal(false);
                setSuccess(null);
                setMedecinSearch('');
                setSelectedMedecinId('');
                setMessage('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la proposition");
        } finally {
            setLoading(false);
        }
    };

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

    const filteredMedecins = members.filter(member =>
        `${member.prenom} ${member.nom}`.toLowerCase().includes(medecinSearch.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <h1 className={styles.title}>📅 Planning des Gardes</h1>
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Déconnexion
                </button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <div className={styles.menuButtons}>
                <button
                    className={`${styles.menuButton} ${activeFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    Toutes les gardes
                </button>
                <button
                    className={`${styles.menuButton} ${activeFilter === 'my' ? styles.active : ''}`}
                    onClick={() => setActiveFilter('my')}
                >
                    Mes gardes
                </button>
                <Link href="/front/EchangeModel" className={styles.menuButton}>
                    Mes echanges
                </Link>
            </div>

            {loadingData ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p>Chargement du planning...</p>
                </div>
            ) : (
                <div className={styles.calendarContainer}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="fr"
                        events={events}
                        height="auto"
                        eventClick={handleEventClick}
                        headerToolbar={{
                            start: 'title',
                            center: '',
                            end: 'prev,next today'
                        }}
                        selectable={false}
                    />
                </div>
            )}

            {/* Garde Details Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Garde du {selectedGarde && formatDate(selectedGarde.start)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedGarde && (
                        <div className={styles.gardeModalContent}>
                            <div className={styles.gardeInfo}>
                                <p><strong>Service :</strong> {selectedGarde.service}</p>
                                <p><strong>Médecin :</strong> {selectedGarde.prenom} {selectedGarde.nom}</p>
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.actionSection}>
                                <h5 className={styles.sectionTitle}>Actions :</h5>
                                <div className={styles.actionButtons}>
                                    {userData && String(selectedGarde.doctorId) === String(userData._id || userData.id) && (
                                        <>
                                            <Button
                                                variant="primary"
                                                className={styles.actionButton}
                                                onClick={handleGiveGarde}
                                            >
                                                donne cette garde
                                            </Button>
                                            <Button
                                                variant="success"
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    if (selectedGarde?.id) {
                                                        router.push(`/front/echange?gardeId=${selectedGarde.id}`);
                                                    } else {
                                                        setError("Impossible d'ouvrir la page d'échange : ID de garde non trouvé.");
                                                    }
                                                    setShowModal(false);
                                                }}
                                            >
                                                J'échange ma garde
                                            </Button>
                                        </>
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

            {/* Exchange Proposal Modal */}
            <Modal show={showExchangeModal} onHide={() => {
                setShowExchangeModal(false);
                setMedecinSearch('');
                setSelectedMedecinId('');
                setMessage('');
            }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Proposer un échange</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {selectedGarde && (
                        <div className="mb-4">
                            <h5>Vous souhaitez échanger :</h5>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-1"><strong>Date :</strong> {formatDate(selectedGarde.start)}</p>
                                <p className="mb-1"><strong>Service :</strong> {selectedGarde.service}</p>
                                <p className="mb-0"><strong>Attribuée à :</strong> {selectedGarde.prenom} {selectedGarde.nom}</p>
                            </div>
                        </div>
                    )}

                    <Form onSubmit={handleExchangeSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Choisir un médecin :</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type="text"
                                    value={medecinSearch}
                                    onChange={(e) => {
                                        setMedecinSearch(e.target.value);
                                        setShowMedecinList(true);
                                    }}
                                    onFocus={() => setShowMedecinList(true)}
                                    placeholder="Tapez un nom"
                                    autoComplete="off"
                                />
                                {showMedecinList && filteredMedecins.length > 0 && (
                                    <div className="position-absolute w-100 bg-white border rounded mt-1 z-index-1000"
                                        style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {filteredMedecins.map((medecin) => (
                                            <div
                                                key={medecin.id}
                                                className="p-2 hover-bg cursor-pointer"
                                                onClick={() => handleSelectMedecin(medecin)}
                                            >
                                                {medecin.prenom} {medecin.nom} ({medecin.service})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {medecinSearch && !selectedMedecinId && (
                                <Form.Text className="text-muted">
                                    {filteredMedecins.length === 0 ? "Aucun médecin trouvé" : "Sélectionnez un médecin"}
                                </Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Message :</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Expliquez votre demande..."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-3">
                            <Button variant="outline-secondary" onClick={() => setShowExchangeModal(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading || !selectedMedecinId}>
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Envoi en cours...
                                    </>
                                ) : 'Envoyer la proposition'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <style jsx>{`
                .hover-bg:hover {
                    background-color: #f8f9fa;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .z-index-1000 {
                    z-index: 1000;
                }
            `}</style>
        </div>
    );
}