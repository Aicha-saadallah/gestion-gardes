import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Form, Alert, Badge, Spinner, ListGroup, Tab, Tabs, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '@/styles/service.module.css';
import { useRouter } from 'next/router';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Header from '@/components/head';

export default function ServicePlanning() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingExchanges, setPendingExchanges] = useState([]);
  const [allExchanges, setAllExchanges] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('inscriptions');
  const [exchangeFilter, setExchangeFilter] = useState('all');
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [userService, setUserService] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/front/login');
      return;
    }

    try {
      const decoded = jwt.decode(token);
      if (decoded.role !== 'Chef de service') {
        router.push('/');
      } else {
        setUserService(decoded.service);
        // Ensure that the 'id' of the decoded token is also available
        // as it might be needed for some API calls or checks.
        // If your token payload has `id` and `_id`, make sure you're using the correct one.
      }
    } catch (err) {
      console.error("Erreur de décodage du jeton ou rôle invalide:", err);
      router.push('/front/login');
    }
  }, [router]);

  useEffect(() => {
    if (userService) {
      fetchData();
    }
  }, [userService, exchangeFilter]); // Re-fetch data when userService or exchangeFilter changes

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchGardes(),
        fetchPendingRequests(),
        fetchPendingExchanges(),
        fetchMedecins(),
        fetchAllExchanges()
      ]);
    } catch (err) {
      console.error("Erreur fetchData:", err);
      setAlert({
        variant: 'danger',
        message: "Erreur lors du chargement des données. Veuillez réessayer."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGardes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Token manquant pour fetchGardes. Redirection vers la connexion.");
        router.push('/front/login'); // Redirect if token is missing
        return;
      }
      const res = await axios.get('/api/back/mod/garde', {
        params: { service: userService },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setEvents(res.data.gardes.map(g => ({
          ...g,
          title: `${g.prenom} ${g.nom}`,
          start: g.date,
          end: g.date,
          allDay: true
        })));
      }
    } catch (err) {
      console.error("Erreur fetchGardes:", err.response?.data || err.message || err);
      throw err; // Re-throw to be caught by fetchData's Promise.all
    }
  };

  const fetchMedecins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Token manquant pour fetchMedecins. Redirection vers la connexion.");
        router.push('/front/login');
        return;
      }
      const user = jwt.decode(token); // Decode again if needed, or pass from useEffect

      const response = await axios.get('/api/back/mod/serviceGarde', {
        params: {
          service: userService,
          currentUserId: user.id // Make sure user.id is correctly populated from the token
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMedecins(response.data.data.members);
      }
    } catch (err) {
      console.error("Erreur fetchMedecins:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors du chargement des médecins"
      });
      throw err;
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Token manquant pour fetchPendingRequests. Redirection vers la connexion.");
        router.push('/front/login');
        return;
      }
      const response = await axios.get('/api/back/mod/approval', {
        params: { service: userService },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingRequests(response.data.doctors);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error("Erreur fetchPendingRequests:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors du chargement des demandes"
      });
      throw err;
    }
  };

  const fetchPendingExchanges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Token manquant pour fetchPendingExchanges. Redirection vers la connexion.");
        router.push('/front/login');
        return;
      }
      // console.log('Fetching pending exchanges with token:', token); // For debugging: check token content
      const response = await axios.get('/api/back/mod/exchanges', {
        params: { service: userService, status: 'pending' },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingExchanges(response.data.exchanges);
      }
    } catch (err) {
      console.error("Erreur fetchPendingExchanges:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors du chargement des échanges en attente"
      });
      // Do not re-throw here, as it's part of Promise.all and already handled by local alert
    }
  };

  const fetchAllExchanges = async () => {
    setExchangeLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("Token manquant pour fetchAllExchanges. Redirection vers la connexion.");
        router.push('/front/login');
        return;
      }
      // console.log('Fetching all exchanges with token:', token, 'Filter:', exchangeFilter); // For debugging
      const response = await axios.get('/api/back/mod/exchanges', {
        params: {
          service: userService,
          status: exchangeFilter === 'all' ? undefined : exchangeFilter // Send 'undefined' for 'all' to backend
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAllExchanges(response.data.exchanges);
      }
    } catch (err) {
      console.error("Erreur fetchAllExchanges:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors du chargement des échanges"
      });
    } finally {
      setExchangeLoading(false);
    }
  };

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setSelectedEvent(null);
    setSelectedMedecin('');
    setShowModal(true);
  };

  const handleEventClick = (arg) => {
    setSelectedDate(arg.event.startStr);
    setSelectedEvent(arg.event);
    setSelectedMedecin(arg.event.extendedProps.doctor);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({ variant: 'danger', message: "Authentification requise pour cette action." });
        router.push('/front/login');
        return;
      }

      if (!selectedMedecin) {
        throw new Error("Veuillez sélectionner un médecin");
      }

      const medecin = medecins.find(m => m.id === selectedMedecin);
      if (!medecin) {
        throw new Error("Médecin sélectionné introuvable.");
      }

      if (selectedEvent) {
        await axios.put('/api/back/mod/garde', {
          id: selectedEvent.extendedProps._id,
          date: selectedDate,
          doctorId: selectedMedecin,
          nom: medecin.nom,
          prenom: medecin.prenom
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde modifiée avec succès' });
      } else {
        await axios.post('/api/back/mod/garde', {
          date: selectedDate,
          service: userService,
          doctorId: selectedMedecin,
          nom: medecin.nom,
          prenom: medecin.prenom
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde ajoutée avec succès' });
      }

      setShowModal(false);
      await fetchGardes(); // Refresh calendar events
    } catch (err) {
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || err.message || "Erreur lors de l'enregistrement"
      });
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({ variant: 'danger', message: "Authentification requise pour cette action." });
        router.push('/front/login');
        return;
      }
      await axios.delete('/api/back/mod/garde', {
        params: { id: selectedEvent.extendedProps._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlert({ variant: 'success', message: 'Garde supprimée avec succès' });
      setShowModal(false);
      await fetchGardes(); // Refresh calendar events
    } catch (err) {
      setAlert({ variant: 'danger', message: err.response?.data?.message || "Erreur lors de la suppression" });
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({ variant: 'danger', message: "Authentification requise pour cette action." });
        router.push('/front/login');
        return;
      }
      const decoded = jwt.decode(token); // Ensure 'decoded.id' is available for approverId

      const response = await axios.put('/api/back/mod/approval', {
        id,
        action,
        approverId: decoded.id // Pass the approver's ID from the token
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingRequests(pendingRequests.filter(req => req._id !== id));
        setAlert({
          variant: 'success',
          message: response.data.message
        });
        await fetchGardes(); // Gardes might change after approval
      }
    } catch (err) {
      console.error("Erreur handleApproval:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors de l'opération"
      });
    }
  };

  const handleExchangeDecision = async (exchangeId, decision) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert({ variant: 'danger', message: "Authentification requise pour cette action." });
        router.push('/front/login');
        return;
      }
      const decoded = jwt.decode(token);

      const response = await axios.put('/api/back/mod/exchanges', {
        exchangeId,
        decision,
        approverId: decoded.id // Ensure this ID is available from your token
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Remove from pending list if it was a pending exchange
        setPendingExchanges(prev => prev.filter(ex => ex._id !== exchangeId));
        // Update the status in the allExchanges list
        setAllExchanges(prev => prev.map(ex =>
          ex._id === exchangeId ? { ...ex, status: decision === 'approve' ? 'approved' : 'rejected' } : ex
        ));
        setAlert({
          variant: 'success',
          message: response.data.message
        });
        await fetchGardes(); // Refresh calendar events as gardes might have changed
      }
    } catch (err) {
      console.error("Erreur handleExchangeDecision:", err.response?.data || err.message || err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors de la décision"
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "Date invalide"; // Handle potentially invalid dates from backend
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'approved':
        return <Badge bg="success">Approuvé</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejeté</Badge>;
      case 'cancelled':
        return <Badge bg="secondary">Annulé</Badge>; // Added for consistency
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Planning des gardes - Service {userService}</h1>
          <Button
            variant={showRequests ? 'secondary' : 'primary'}
            onClick={() => setShowRequests(!showRequests)}
          >
            Demandes en attente
            {(pendingRequests.length > 0 || pendingExchanges.length > 0) && (
              <Badge bg="danger" className="ms-2">
                {pendingRequests.length + pendingExchanges.length}
              </Badge>
            )}
          </Button>
        </div>

        {alert && (
          <Alert variant={alert.variant} onClose={() => setAlert(null)} dismissible>
            {alert.message}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p>Chargement des données...</p>
          </div>
        ) : (
          <>
            {showRequests && (
              <div className="mt-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-3"
                >
                  <Tab eventKey="inscriptions" title="Inscriptions">
                    <h3 className="mt-3">Demandes d'inscription</h3>
                    {pendingRequests.length > 0 ? (
                      <ListGroup>
                        {pendingRequests.map(request => (
                          <ListGroup.Item key={request._id} className="mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h5>{request.prenom} {request.nom}</h5>
                                <p className="mb-1"><strong>Email:</strong> {request.email}</p>
                                <p className="mb-1"><strong>Service:</strong> {request.service}</p>
                                <small className="text-muted">
                                  Demandé le: {formatDate(request.createdAt)}
                                </small>
                              </div>
                              <div>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleApproval(request._id, 'approve')}
                                  className="me-2"
                                >
                                  Accepter
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleApproval(request._id, 'reject')}
                                >
                                  Refuser
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p>Aucune demande d'inscription en attente</p>
                    )}
                  </Tab>
                  <Tab eventKey="echanges" title="Échanges en attente">
                    <h3 className="mt-3">Demandes d'échange</h3>
                    {pendingExchanges.length > 0 ? (
                      <ListGroup>
                        {pendingExchanges.map(exchange => (
                          <ListGroup.Item key={exchange._id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h5>Demande de {exchange.fromDoctor.prenom} {exchange.fromDoctor.nom}</h5>
                                <p className="mb-1"><strong>Date de demande:</strong> {formatDate(exchange.createdAt)}</p>

                                <div className="mt-2">
                                  <h6>Gardes à donner:</h6>
                                  <ul>
                                    {exchange.gardesToGive.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.doctor?.nom} {garde.doctor?.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-2">
                                  <h6>Gardes à recevoir:</h6>
                                  <ul>
                                    {exchange.gardesToGet.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.doctor?.nom} {garde.doctor?.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {exchange.message && (
                                  <div className="mt-2">
                                    <h6>Message:</h6>
                                    <p>{exchange.message}</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleExchangeDecision(exchange._id, 'approve')}
                                  className="me-2"
                                >
                                  Approuver
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleExchangeDecision(exchange._id, 'reject')}
                                >
                                  Rejeter
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p>Aucune demande d'échange en attente</p>
                    )}
                  </Tab>
                  <Tab eventKey="allExchanges" title="Tous les échanges">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="mt-3">Historique des échanges</h3>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-filter">
                          Filtre: {exchangeFilter === 'all' ? 'Tous' :
                            exchangeFilter === 'pending' ? 'En attente' :
                              exchangeFilter === 'approved' ? 'Approuvés' :
                                exchangeFilter === 'rejected' ? 'Rejetés' : 'Annulés'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setExchangeFilter('all')}>Tous</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('pending')}>En attente</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('approved')}>Approuvés</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('rejected')}>Rejetés</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('cancelled')}>Annulés</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    {exchangeLoading ? (
                      <div className="text-center my-4">
                        <Spinner animation="border" />
                        <p>Chargement des échanges...</p>
                      </div>
                    ) : allExchanges.length > 0 ? (
                      <ListGroup>
                        {allExchanges.map(exchange => (
                          <ListGroup.Item key={exchange._id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="d-flex align-items-center mb-2">
                                  <h5 className="mb-0 me-2">Demande de {exchange.fromDoctor.prenom} {exchange.fromDoctor.nom}</h5>
                                  {getStatusBadge(exchange.status)}
                                </div>
                                <p className="mb-1"><strong>Date de demande:</strong> {formatDate(exchange.createdAt)}</p>
                                {exchange.respondedAt && ( // Use respondedAt as per your schema
                                  <p className="mb-1"><strong>Date de décision:</strong> {formatDate(exchange.respondedAt)}</p>
                                )}
                                {exchange.respondedBy && exchange.respondedBy.nom && ( // Check for respondedBy existence
                                  <p className="mb-1"><strong>Décision prise par:</strong> {exchange.respondedBy.prenom} {exchange.respondedBy.nom}</p>
                                )}

                                <div className="mt-2">
                                  <h6>Gardes à donner:</h6>
                                  <ul>
                                    {exchange.gardesToGive.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.doctor?.nom} {garde.doctor?.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-2">
                                  <h6>Gardes à recevoir:</h6>
                                  <ul>
                                    {exchange.gardesToGet.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.doctor?.nom} {garde.doctor?.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {exchange.message && (
                                  <div className="mt-2">
                                    <h6>Message:</h6>
                                    <p>{exchange.message}</p>
                                  </div>
                                )}
                              </div>
                              {exchange.status === 'pending' && (
                                <div>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleExchangeDecision(exchange._id, 'approve')}
                                    className="me-2"
                                  >
                                    Approuver
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleExchangeDecision(exchange._id, 'reject')}
                                  >
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <Alert variant="info">
                        Aucun échange {{
                          pending: 'en attente',
                          approved: 'approuvé',
                          rejected: 'rejeté',
                          cancelled: 'annulé',
                          all: ''
                        }[exchangeFilter]} trouvé.
                      </Alert>
                    )}
                  </Tab>
                </Tabs>
              </div>
            )}

            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="fr"
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                headerToolbar={{
                  start: 'title',
                  center: '',
                  end: 'prev,next today'
                }}
              />
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>{selectedEvent ? 'Modifier' : 'Ajouter'} une garde</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDate}
                      disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Médecin</Form.Label>
                    <Form.Select
                      value={selectedMedecin}
                      onChange={(e) => setSelectedMedecin(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map(medecin => (
                        <option key={medecin.id} value={medecin.id}>
                          {medecin.prenom} {medecin.nom} ({medecin.role})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                {selectedEvent && (
                  <Button variant="danger" onClick={handleDelete}>
                    Supprimer
                  </Button>
                )}
                <Button variant="primary" onClick={handleSave}>
                  {selectedEvent ? 'Modifier' : 'Ajouter'}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </div>
    </>
  );
}