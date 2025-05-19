// pages/front/EchangeModel.js
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import styles from "@/styles/echange.module.css";
import { Modal, Button, Alert, Spinner, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';

export default function EchangeModel() {
    const [sentExchanges, setSentExchanges] = useState([]);
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
            router.push("/front/login");
        }
    }, [router]);

    useEffect(() => {
        async function fetchExchanges() {
            if (!userData) {
                console.log("userData est null, la récupération des échanges est ignorée.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const myId = userData._id || userData.id;
                console.log("Récupération des échanges pour l'ID utilisateur:", myId);
                const sentRes = await axios.get(`/api/back/mod/exchange?fromDoctor=${myId}`);
                setSentExchanges(sentRes.data?.exchangesSent || []);

                const receivedRes = await axios.get(`/api/back/mod/exchange?toDoctor=${myId}`);
                setReceivedExchanges(receivedRes.data?.exchangesReceived || []);
                if (receivedRes.data?.exchangesReceived?.length > 0) {
                    console.log("Structure du premier échange reçu:", receivedRes.data.exchangesReceived[0]);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des échanges:", err);
                setError("Erreur lors du chargement des demandes d'échange.");
            } finally {
                setLoading(false);
            }
        }

        if (userData) {
            fetchExchanges();
        }
    }, [userData]);

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

    const confirmAction = async () => {
        setShowConfirmationModal(false);
        console.log("confirmAction appelé avec exchangeIdToHandle:", exchangeIdToHandle, "et actionType:", actionType);
        if (!exchangeIdToHandle || !actionType) {
            console.error("Erreur: exchangeIdToHandle ou actionType est null.");
            setError("Erreur lors de la confirmation de l'action.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post(
                `/api/back/mod/exchange?id=${exchangeIdToHandle}&action=${actionType}`
            );

            if (response.data?.success) {
                setSuccess(`Demande d'échange ${actionType === 'accept' ? 'acceptée' : 'refusée'} avec succès.`);

                const myId = userData._id || userData.id;
                const sentRes = await axios.get(`/api/back/mod/exchange?fromDoctor=${myId}`);
                setSentExchanges(sentRes.data?.exchangesSent || []);

                const receivedRes = await axios.get(`/api/back/mod/exchange?toDoctor=${myId}`);
                setReceivedExchanges(receivedRes.data?.exchangesReceived || []);
            } else {
                setError(response.data?.message || `Erreur lors de l'${actionType === 'accept' ? 'acceptation' : 'refus'}.`);
            }
        } catch (err) {
            console.error("Erreur lors de la confirmation de l'échange:", err);
            setError(`Erreur lors de l'${actionType === 'accept' ? 'acceptation' : 'refus'}.`);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000);
        }
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
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Date(s)</th>
                                        <th>Destinataire</th>
                                        <th>Message</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentExchanges.map(exchange => (
                                        <tr key={exchange._id}>
                                            <td>
                                                {Array.isArray(exchange.gardeId) ? (
                                                    <ul>
                                                        {exchange.gardeId.map(garde => (
                                                            <li key={garde._id}>{garde.date ? formatDate(garde.date) : 'Date inconnue'}</li>
                                                        ))}
                                                    </ul>
                                                ) : exchange.gardeId?.date ? (
                                                    formatDate(exchange.gardeId.date)
                                                ) : (
                                                    'Date inconnue'
                                                )}
                                            </td>
                                            <td>{exchange.toDoctor?.prenom} {exchange.toDoctor?.nom}</td>
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
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Date(s)</th>
                                        <th>Expéditeur</th>
                                        <th>Message</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivedExchanges.map(exchange => (
                                        <tr key={exchange._id}>
                                            <td>
                                                {Array.isArray(exchange.gardeId) ? (
                                                    <ul>
                                                        {exchange.gardeId.map(garde => (
                                                            <li key={garde._id}>{garde.date ? formatDate(garde.date) : 'Date inconnue'}</li>
                                                        ))}
                                                    </ul>
                                                ) : exchange.gardeId?.date ? (
                                                    formatDate(exchange.gardeId.date)
                                                ) : (
                                                    'Date inconnue'
                                                )}
                                            </td>
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