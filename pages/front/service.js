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

  // Effect to handle authentication and set userService
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token found, redirecting to login.");
      router.push('/front/login');
      return;
    }

    try {
      const decoded = jwt.decode(token);
      if (decoded.role !== 'Chef de service') {
        console.log("User is not Chef de service, redirecting to homepage.");
        router.push('/');
      } else {
        setUserService(decoded.service);
        console.log("UserService set to:", decoded.service);
      }
    } catch (err) {
      console.error("Failed to decode token, redirecting to login:", err);
      router.push('/front/login');
    }
  }, [router]);

  // Effect to fetch data when userService or exchangeFilter changes
  useEffect(() => {
    if (userService) { // Only fetch data if userService is set
      console.log("Calling fetchData due to userService or exchangeFilter change. Current userService:", userService, "Filter:", exchangeFilter);
      fetchData();
    } else {
      console.log("userService not yet set, skipping fetchData.");
    }
  }, [userService, exchangeFilter]); // Depend on userService and exchangeFilter

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
      console.log("All initial data fetched successfully.");
    } catch (err) {
      console.error("Erreur fetchData (Promise.all caught):", err);
      setAlert({
        variant: 'danger',
        message: "Erreur lors du chargement des données initiales. Veuillez vérifier la console pour plus de détails."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGardes = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Attempting to fetch gardes for service:", userService);
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
        console.log("Gardes fetched successfully:", res.data.gardes.length);
      } else {
        throw new Error(res.data.message || "Failed to fetch gardes.");
      }
    } catch (err) {
      console.error("Erreur fetchGardes:", err.message, err.response?.data);
      // Don't set alert here if it's part of Promise.all, let fetchData handle it.
      throw err;
    }
  };

  const fetchMedecins = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = jwt.decode(token); // Decoding token for currentUserId
      console.log("Attempting to fetch medecins for service:", userService);
      
      const response = await axios.get('/api/back/mod/serviceGarde', {
        params: { 
          service: userService,
          currentUserId: user.id 
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMedecins(response.data.data.members);
        console.log("Medecins fetched successfully:", response.data.data.members.length);
      } else {
        throw new Error(response.data.message || "Failed to fetch medecins.");
      }
    } catch (err) {
      console.error("Erreur fetchMedecins:", err.message, err.response?.data);
      // Don't set alert here if it's part of Promise.all, let fetchData handle it.
      throw err;
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Attempting to fetch pending requests for service:", userService);
      const response = await axios.get('/api/back/mod/approval', {
        params: { service: userService },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingRequests(response.data.doctors);
        console.log("Pending requests fetched successfully:", response.data.doctors.length);
      } else {
        throw new Error(response.data.message || "Failed to fetch pending requests.");
      }
    } catch (err) {
      console.error("Erreur fetchPendingRequests:", err.message, err.response?.data);
      // Don't set alert here if it's part of Promise.all, let fetchData handle it.
      throw err;
    }
  };

  const fetchPendingExchanges = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Attempting to fetch pending exchanges for service:", userService, "with status 'en attente'");
      const response = await axios.get('/api/back/mod/exchanges', {
        params: { service: userService, status: 'en attente' }, // Match backend enum
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingExchanges(response.data.exchanges);
        console.log("Pending exchanges fetched successfully:", response.data.exchanges.length);
      } else {
        throw new Error(response.data.message || "Failed to fetch pending exchanges.");
      }
    } catch (err) {
      console.error("Erreur fetchPendingExchanges:", err.message, err.response?.data);
      // Don't set alert here if it's part of Promise.all, let fetchData handle it.
      throw err;
    }
  };

  const fetchAllExchanges = async () => {
    setExchangeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusParam = exchangeFilter === 'all' ? undefined : 
                          exchangeFilter === 'pending' ? 'en attente' :
                          exchangeFilter === 'approved' ? 'accepté' :
                          exchangeFilter === 'rejected' ? 'refusé' : undefined;

      console.log("Attempting to fetch all exchanges for service:", userService, "with filter:", exchangeFilter, "=> backend status:", statusParam);
      const response = await axios.get('/api/back/mod/exchanges', {
        params: { 
          service: userService,
          status: statusParam
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAllExchanges(response.data.exchanges);
        console.log("All exchanges fetched successfully:", response.data.exchanges.length);
      } else {
        throw new Error(response.data.message || "Failed to fetch all exchanges.");
      }
    } catch (err) {
      console.error("Client-side error fetching all exchanges:", err.message, err.response?.data);
      // This fetch is called directly by fetchData, but also independently by filter changes.
      // So, it's okay to set alert here.
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors du chargement des échanges."
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
    setSelectedMedecin(arg.event.extendedProps.doctorId); // Ensure this matches your event structure
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!selectedMedecin) {
        throw new Error("Veuillez sélectionner un médecin.");
      }

      const medecin = medecins.find(m => m.id === selectedMedecin);
      if (!medecin) {
        throw new Error("Médecin sélectionné introuvable.");
      }

      console.log("Saving garde:", { date: selectedDate, doctorId: selectedMedecin, service: userService });

      if (selectedEvent) {
        // Update existing garde
        const updatePayload = {
          id: selectedEvent.extendedProps._id,
          date: selectedDate,
          doctorId: selectedMedecin,
          nom: medecin.nom,
          prenom: medecin.prenom
        };
        await axios.put('/api/back/mod/garde', updatePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde modifiée avec succès.' });
        console.log("Garde updated:", updatePayload);
      } else {
        // Add new garde
        const addPayload = {
          date: selectedDate,
          service: userService,
          doctorId: selectedMedecin,
          nom: medecin.nom,
          prenom: medecin.prenom
        };
        await axios.post('/api/back/mod/garde', addPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde ajoutée avec succès.' });
        console.log("Garde added:", addPayload);
      }
      
      setShowModal(false);
      await fetchGardes(); // Refresh calendar events
    } catch (err) {
      console.error("Erreur handleSave:", err.message, err.response?.data);
      setAlert({ 
        variant: 'danger', 
        message: err.response?.data?.message || err.message || "Erreur lors de l'enregistrement de la garde." 
      });
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Deleting garde with ID:", selectedEvent.extendedProps._id);
      await axios.delete('/api/back/mod/garde', {
        params: { id: selectedEvent.extendedProps._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlert({ variant: 'success', message: 'Garde supprimée avec succès.' });
      setShowModal(false);
      await fetchGardes(); // Refresh calendar events
    } catch (err) {
      console.error("Erreur handleDelete:", err.message, err.response?.data);
      setAlert({ variant: 'danger', message: err.response?.data?.message || "Erreur lors de la suppression." });
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwt.decode(token);
      console.log(`Approving/rejecting request ID ${id} with action ${action}`);

      const response = await axios.put('/api/back/mod/approval', {
        id,
        action,
        approverId: decoded.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingRequests(pendingRequests.filter(req => req._id !== id));
        setAlert({
          variant: 'success',
          message: response.data.message
        });
        await fetchGardes(); // Refresh the calendar to reflect changes
        console.log(`Request ID ${id} ${action}d successfully.`);
      } else {
        throw new Error(response.data.message || "Failed to approve/reject request.");
      }
    } catch (err) {
      console.error("Erreur handleApproval:", err.message, err.response?.data);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors de la décision d'inscription."
      });
    }
  };

  const handleExchangeDecision = async (exchangeId, decision) => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwt.decode(token);
      console.log(`Deciding on exchange ID ${exchangeId} with decision ${decision}`);

      const response = await axios.put('/api/back/mod/exchanges', {
        exchangeId,
        decision,
        approverId: decoded.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Remove from pending exchanges if approved/rejected
        setPendingExchanges(pendingExchanges.filter(ex => ex._id !== exchangeId));
        // Update status in all exchanges
        setAllExchanges(prevExchanges => prevExchanges.map(ex => 
          ex._id === exchangeId ? { ...ex, status: decision === 'approve' ? 'accepté' : 'refusé' } : ex
        ));
        setAlert({
          variant: 'success',
          message: response.data.message
        });
        await fetchGardes(); // Refresh the calendar to reflect changes
        console.log(`Exchange ID ${exchangeId} ${decision}d successfully.`);
      } else {
        throw new Error(response.data.message || "Failed to make exchange decision.");
      }
    } catch (err) {
      console.error("Erreur handleExchangeDecision:", err.message, err.response?.data);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors de la décision d'échange."
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'en attente':
        return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'accepté':
        return <Badge bg="success">Approuvé</Badge>;
      case 'refusé':
        return <Badge bg="danger">Rejeté</Badge>;
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
                                  Demandé le: {new Date(request.createdAt).toLocaleDateString('fr-FR')}
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
                                        {formatDate(garde.date)} - {garde.nom} {garde.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-2">
                                  <h6>Gardes à recevoir:</h6>
                                  <ul>
                                    {exchange.gardesToGet.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.nom} {garde.prenom}
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
                                  exchangeFilter === 'approved' ? 'Approuvés' : 'Rejetés'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setExchangeFilter('all')}>Tous</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('pending')}>En attente</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('approved')}>Approuvés</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExchangeFilter('rejected')}>Rejetés</Dropdown.Item>
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
                                {exchange.approvedAt && (
                                  <p className="mb-1"><strong>Date de décision:</strong> {formatDate(exchange.approvedAt)}</p>
                                )}
                                
                                <div className="mt-2">
                                  <h6>Gardes à donner:</h6>
                                  <ul>
                                    {exchange.gardesToGive.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.nom} {garde.prenom}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-2">
                                  <h6>Gardes à recevoir:</h6>
                                  <ul>
                                    {exchange.gardesToGet.map(garde => (
                                      <li key={garde._id}>
                                        {formatDate(garde.date)} - {garde.nom} {garde.prenom}
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
                              {exchange.status === 'en attente' && (
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