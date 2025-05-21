import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import styles from "@/styles/echange.module.css";
import { Modal, Button, Alert, Spinner, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';

export default function EchangeModel() {
    const [sentExchanges, setSentExchanges] = useState([]);
    // CORRECTION ICI: setReceivedExchanges était mal orthographié
    const [receivedExchanges, setReceivedExchanges] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const router = useRouter();
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [exchangeIdToHandle, setExchangeIdToHandle] = useState(null);
    const [actionType, setActionType] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/front/login");
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            setUserData(user);
        } else {
            // Redirige vers la page de connexion si les données utilisateur ne sont pas trouvées
            router.push("/front/login");
        }
    }, [router]);

    useEffect(() => {
        async function fetchExchanges() {
            // S'assure que les données utilisateur sont chargées avant de tenter de récupérer les échanges
            if (!userData) {
                console.log("userData est null, la récupération des échanges est ignorée.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // Utilise _id en premier, puis id comme solution de repli pour l'ID de l'utilisateur
                const myId = userData._id || userData.id;
                console.log("Récupération des échanges pour l'ID utilisateur:", myId);

                // Récupère les échanges en utilisant le paramètre de requête 'userId'
                const response = await axios.get(`/api/back/mod/exchange?userId=${myId}`);

                // Définit les données récupérées dans les variables d'état
                setSentExchanges(response.data?.exchangesSent || []);
                setReceivedExchanges(response.data?.exchangesReceived || []);

                if (response.data?.exchangesReceived?.length > 0) {
                    console.log("Structure du premier échange reçu:", response.data.exchangesReceived[0]);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des échanges:", err.response?.data || err.message);
                setError(err.response?.data?.message || "Erreur lors du chargement des demandes d'échange.");
            } finally {
                setLoading(false);
            }
        }

        // Ne récupère les échanges que si userData est disponible
        if (userData) {
            fetchExchanges();
        }
    }, [userData]); // Réexécute l'effet lorsque userData change

    // Fonction d'aide pour formater les dates
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

    // Gestionnaires pour accepter/rejeter un échange, ouvrant le modal de confirmation
    const handleAccept = (exchangeId) => {
        console.log("handleAccept appelé avec l'ID:", exchangeId);
        setExchangeIdToHandle(exchangeId);
        setActionType('accept');
        setShowConfirmationModal(true);
    };

    const handleReject = (exchangeId) => {
        console.log("handleReject appelé avec l'ID:", exchangeId);
        setExchangeIdToHandle(exchangeId);
        setActionType('reject');
        setShowConfirmationModal(true);
    };

    // Confirme et envoie l'action d'acceptation/rejet au backend
    const confirmAction = async () => {
        setShowConfirmationModal(false); // Ferme le modal immédiatement
        console.log("confirmAction appelé avec exchangeIdToHandle:", exchangeIdToHandle, "et actionType:", actionType);

        if (!exchangeIdToHandle || !actionType || !userData) {
            console.error("Erreur: exchangeId, actionType ou userData manquant.");
            setError("Erreur lors de la confirmation de l'action. Veuillez réessayer.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Envoie l'action et l'ID de l'utilisateur dans le corps de la requête pour traitement
            const response = await axios.post(
                `/api/back/mod/exchange?id=${exchangeIdToHandle}`, // ID d'échange dans la requête pour ciblage
                { action: actionType, userId: userData._id || userData.id } // Action et ID de l'utilisateur actuel dans le corps
            );

            if (response.data?.success) {
                setSuccess(`Demande d'échange ${actionType === 'accept' ? 'acceptée' : 'refusée'} avec succès.`);
                // Re-récupère les échanges pour mettre à jour l'interface utilisateur immédiatement après une action réussie
                const myId = userData._id || userData.id;
                const updatedResponse = await axios.get(`/api/back/mod/exchange?userId=${myId}`);
                setSentExchanges(updatedResponse.data?.exchangesSent || []);
                setReceivedExchanges(updatedResponse.data?.exchangesReceived || []);
            } else {
                setError(response.data?.message || `Erreur lors de l'${actionType === 'accept' ? 'acceptation' : 'refus'}.`);
            }
        } catch (err) {
            console.error("Erreur lors de la confirmation de l'échange:", err.response?.data || err.message);
            setError(err.response?.data?.message || `Erreur lors de l'${actionType === 'accept' ? 'acceptation' : 'refus'}.`);
        } finally {
            setLoading(false);
            // Efface le message de succès après quelques secondes
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    // Aide pour l'affichage des détails des gardes dans les cellules du tableau
    const renderGardeDetails = (gardes) => {
        if (!Array.isArray(gardes) || gardes.length === 0) {
            return 'N/A';
        }
        return (
            <ul>
                {gardes.map(garde => (
                    <li key={garde._id}>
                        {formatDate(garde.date)} - {garde.service}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <h1 className={styles.title}>Mes Demandes d'Échange</h1>
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Déconnexion
                </button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <div className={styles.navigationButtons}>
                <Link href="/front/medecin" className={styles.backButton}>
                    Retour au Planning
                </Link>
                <Link href="/front/echange" className={styles.backButton}>
                    Proposer un échange
                </Link>
            </div>

            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p>Chargement des demandes d'échange...</p>
                </div>
            ) : (
                <>
                    <div className={styles.exchangesSection}>
                        <h2>Demandes envoyées</h2>
                        {sentExchanges.length === 0 ? (
                            <p>Aucune demande d'échange envoyée.</p>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Gardes à donner (Mes gardes)</th>
                                        <th>Gardes à obtenir (Autres gardes)</th>
                                        <th>Médecins impliqués</th>
                                        <th>Message</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentExchanges.map(exchange => (
                                        <tr key={exchange._id}>
                                            <td>{renderGardeDetails(exchange.gardesToGive)}</td>
                                            <td>{renderGardeDetails(exchange.gardesToGet)}</td>
                                            <td>
                                                {Array.isArray(exchange.toDoctors) ? (
                                                    <ul>
                                                        {exchange.toDoctors.map(doctor => (
                                                            <li key={doctor._id}>{doctor.prenom} {doctor.nom}</li>
                                                        ))}
                                                    </ul>
                                                ) : 'N/A'}
                                            </td>
                                            <td>{exchange.message}</td>
                                            <td>{exchange.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>

                    <div className={styles.exchangesSection}>
                        <h2>Demandes reçues</h2>
                        {receivedExchanges.length === 0 ? (
                            <p>Aucune demande d'échange reçue.</p>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Gardes à donner (Gardes de l'expéditeur)</th>
                                        <th>Gardes à obtenir (Vos gardes)</th>
                                        <th>Expéditeur</th>
                                        <th>Message</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivedExchanges.map(exchange => (
                                        <tr key={exchange._id}>
                                            <td>{renderGardeDetails(exchange.gardesToGive)}</td>
                                            <td>{renderGardeDetails(exchange.gardesToGet)}</td>
                                            <td>{exchange.fromDoctor?.prenom} {exchange.fromDoctor?.nom}</td>
                                            <td>{exchange.message}</td>
                                            <td>
                                                {exchange.status === "en attente" ? (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            className="me-2"
                                                            onClick={() => handleAccept(exchange._id)}
                                                            disabled={loading}
                                                        >
                                                            Accepter
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            onClick={() => handleReject(exchange._id)}
                                                            disabled={loading}
                                                        >
                                                            Refuser
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span>{exchange.status}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>
                </>
            )}

            <Modal show={showConfirmationModal} onHide={() => setShowConfirmationModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Êtes-vous sûr de vouloir {actionType === 'accept' ? 'accepter' : 'refuser'} cette demande ?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmationModal(false)}>
                        Annuler
                    </Button>
                    <Button
                        variant={actionType === 'accept' ? 'success' : 'danger'}
                        onClick={confirmAction}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : 'Confirmer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}