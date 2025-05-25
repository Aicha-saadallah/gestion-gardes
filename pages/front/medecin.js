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
    const [showGiveModal, setShowGiveModal] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedMedecinId, setSelectedMedecinId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [medecinSearch, setMedecinSearch] = useState('');
    const [showMedecinList, setShowMedecinList] = useState(false);
    const [medecinAvailability, setMedecinAvailability] = useState({});
    const calendarRef = useRef(null);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/front/login");
    };

    const checkMedecinAvailability = async (medecinId, date) => {
        try {
            const response = await axios.get(`/api/back/mod/checkMedecinDispo?medecinId=${medecinId}&date=${date}`);
            return !response.data.hasGarde;
        } catch (err) {
            console.error("Erreur vérification disponibilité:", err);
            return false;
        }
    };

    const handleSelectMedecin = (medecin) => {
        setSelectedMedecinId(medecin.id);
        setMedecinSearch(`${medecin.prenom} ${medecin.nom}`);
        setShowMedecinList(false);
    };

    const fetchData = async () => {
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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const formattedGardes = gardes.map((g) => {
                const gardeDate = new Date(g.date);
                const isPast = gardeDate <= today;
                
                return {
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
                    borderColor: String(g.doctor) === myId ? 'blue' : '',
                    className: isPast ? 'past-garde' : '',
                    startEditable: !isPast,
                    durationEditable: !isPast
                };
            });

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
        fetchData();
    }, [userData, activeFilter]);

    const handleEventClick = (info) => {
        const event = allGardes.find((garde) => garde.id === info.event.id);
        if (event) {
            const gardeDate = new Date(event.start);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (gardeDate <= today) {
                setError("Cette garde est passée ou a lieu aujourd'hui et ne peut pas être modifiée.");
                return;
            }
            
            setSelectedGarde(event);
            setShowModal(true);
        }
    };

    const handleInitiateGiveGarde = async () => {
        setShowModal(false);
        setShowGiveModal(true);
        setMessage('');
        setMedecinSearch('');
        setSelectedMedecinId('');
        setMedecinAvailability({});
    };

    const handleMedecinSearchChange = async (e) => {
        setMedecinSearch(e.target.value);
        setShowMedecinList(true);
        
        if (selectedGarde) {
            const availabilityMap = {};
            for (const medecin of members) {
                if (`${medecin.prenom} ${medecin.nom}`.toLowerCase().includes(e.target.value.toLowerCase())) {
                    const isAvailable = await checkMedecinAvailability(medecin.id, selectedGarde.start);
                    availabilityMap[medecin.id] = isAvailable;
                }
            }
            setMedecinAvailability(availabilityMap);
        }
    };

    const handleSubmitGiveGarde = async (e) => {
        e.preventDefault();
        if (!selectedGarde || !selectedMedecinId) {
            setError("Veuillez sélectionner un médecin à qui donner la garde.");
            return;
        }

        // Vérifications de date
        const gardeDate = new Date(selectedGarde.start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Vérifier si la date est passée ou aujourd'hui
        if (gardeDate <= today) {
            setError("Impossible de modifier une garde dont la date est aujourd'hui ou passée.");
            return;
        }

        // 2. Vérifier qu'il reste au moins 1 jour avant la garde
        const oneDayBefore = new Date(gardeDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        
        if (today >= oneDayBefore) {
            setError("Les demandes doivent être faites au moins 1 jour avant la date de la garde.");
            return;
        }

        // 3. Vérifier si le médecin est disponible
        if (medecinAvailability[selectedMedecinId] === false) {
            setError("Ce médecin a déjà une garde programmée ce jour-là. Veuillez en choisir un autre.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const response = await axios.post("/api/back/mod/donnerGarde", {
                gardeId: selectedGarde.id,
                nouveauMedecinId: selectedMedecinId,
                raison: message
            }, {
                headers: {
                    'x-user-id': userData._id || userData.id
                }
            });

            setSuccess(response.data.message || "Demande de don envoyée avec succès !");
            await fetchData();

            setTimeout(() => {
                setShowGiveModal(false);
                setSuccess(null);
                setMedecinSearch('');
                setSelectedMedecinId('');
                setMessage('');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'envoi de la demande de don.");
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
                    Mes échanges
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

            {/* Modal de détails de la Garde */}
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
                                        <Button
                                            variant="primary"
                                            className={styles.actionButton}
                                            onClick={handleInitiateGiveGarde}
                                        >
                                            Donner cette garde
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

            {/* Modal pour "Donner une garde" */}
            <Modal show={showGiveModal} onHide={() => setShowGiveModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Donner une garde</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {selectedGarde && (
                        <div className="mb-4">
                            <h5>Vous souhaitez donner la garde du :</h5>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-1"><strong>Date :</strong> {formatDate(selectedGarde.start)}</p>
                                <p className="mb-1"><strong>Service :</strong> {selectedGarde.service}</p>
                                <p className="mb-0"><strong>Actuellement attribuée à :</strong> {selectedGarde.prenom} {selectedGarde.nom}</p>
                            </div>
                        </div>
                    )}

                    <Form onSubmit={handleSubmitGiveGarde}>
                        <Form.Group className="mb-3">
                            <Form.Label>À quel médecin voulez-vous donner cette garde ?</Form.Label>
                            <div className="position-relative">
                                <Form.Control
                                    type="text"
                                    value={medecinSearch}
                                    onChange={handleMedecinSearchChange}
                                    onFocus={() => setShowMedecinList(true)}
                                    placeholder="Rechercher un médecin par nom..."
                                    autoComplete="off"
                                />
                                {showMedecinList && filteredMedecins.length > 0 && (
                                    <div className="position-absolute w-100 bg-white border rounded mt-1 z-index-1000"
                                        style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {filteredMedecins.map((medecin) => (
                                            <div
                                                key={medecin.id}
                                                className={`p-2 ${medecinAvailability[medecin.id] !== false ? 'cursor-pointer hover-bg' : 'disabled-medecin'}`}
                                                onClick={() => medecinAvailability[medecin.id] !== false && handleSelectMedecin(medecin)}
                                            >
                                                <div>
                                                    {medecin.prenom} {medecin.nom} ({medecin.service})
                                                </div>
                                                {medecinAvailability[medecin.id] === false && (
                                                    <div className="medecin-unavailable">
                                                        Déjà une garde ce jour-là
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {medecinSearch && !selectedMedecinId && (
                                <Form.Text className="text-muted">
                                    {filteredMedecins.length === 0 ? "Aucun médecin trouvé" : "Sélectionnez un médecin disponible dans la liste."}
                                </Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Raison de l'attribution (facultatif) :</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ex: 'J'ai un imprévu ce jour-là', 'Je suis en congés', etc."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-3">
                            <Button variant="outline-secondary" onClick={() => setShowGiveModal(false)}>
                                Annuler
                            </Button>
                            <Button 
                                variant="primary" 
                                type="submit" 
                                disabled={loading || !selectedMedecinId || medecinAvailability[selectedMedecinId] === false}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Attribution en cours...
                                    </>
                                ) : 'Donner la garde'}
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
                .past-garde {
                    opacity: 0.6;
                    cursor: not-allowed;
                    pointer-events: none;
                    background-color: #f5f5f5 !important;
                    color: #999 !important;
                    border-color: #ddd !important;
                }
                .past-garde .fc-event-title {
                    text-decoration: line-through;
                }
                .disabled-medecin {
                    color: #ccc;
                    cursor: not-allowed;
                    background-color: #f8f9fa;
                }
                .medecin-unavailable {
                    color: #dc3545;
                    font-size: 0.8em;
                    margin-top: 5px;
                }
            `}</style>
        </div>
    );
}