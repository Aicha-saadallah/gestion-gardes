import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Form, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '@/styles/service.module.css';
import { useRouter } from 'next/router';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Header from '@/components/head';

export default function ServicePlanning() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userService, setUserService] = useState('');
  const router = useRouter();

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
      }
    } catch (err) {
      router.push('/front/login');
    }
  }, [router]);

  useEffect(() => {
    if (userService) {
      fetchData();
    }
  }, [userService]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchGardes().catch(err => { console.error("Erreur fetchGardes:", err); throw err; }),
        fetchPendingRequests().catch(err => { console.error("Erreur fetchPendingRequests:", err); throw err; })
      ]);
    } catch (err) {
      console.error("Erreur fetchData:", err);
      setAlert({
        variant: 'danger',
        message: "Erreur lors du chargement des données"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGardes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/back/mod/garde', {
        params: { service: userService },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setEvents(res.data.gardes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
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
      console.error("Erreur fetchPendingRequests:", err);
      setAlert({
        variant: 'danger',
        message: "Erreur lors du chargement des demandes"
      });
      throw err;
    }
  };

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setSelectedEvent(null);
    setNom('');
    setPrenom('');
    setShowModal(true);
  };

  const handleEventClick = (arg) => {
    setSelectedDate(arg.event.startStr);
    setSelectedEvent(arg.event);
    setNom(arg.event.extendedProps.nom);
    setPrenom(arg.event.extendedProps.prenom);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwt.decode(token);
      
      if (selectedEvent) {
        await axios.put('/api/back/index1', {
          id: selectedEvent.extendedProps._id,
          nom, 
          prenom, 
          date: selectedDate,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde modifiée.' });
      } else {
        // Vous devez obtenir l'ID du médecin à assigner à la garde
        // Par exemple, en faisant une requête pour trouver un médecin avec ce nom/prénom
        const doctorsResponse = await axios.get('/api/back', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const doctor = doctorsResponse.data.find(d => 
          d.nom === nom && d.prenom === prenom && d.service === userService
        );
  
        if (!doctor) {
          throw new Error("Médecin non trouvé dans ce service");
        }
  
        await axios.post('/api/back/index1', {
          nom, 
          prenom, 
          date: selectedDate, 
          service: userService,
          doctorId: doctor._id // Ajout de l'ID du médecin
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert({ variant: 'success', message: 'Garde ajoutée.' });
      }
      setShowModal(false);
      fetchGardes();
    } catch (err) {
      setAlert({ 
        variant: 'danger', 
        message: err.response?.data?.message || "Erreur lors de l'enregistrement" 
      });
    }
  };
  
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/back/index1', {
        params: { id: selectedEvent.extendedProps._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      fetchGardes();
    } catch (err) {
      setAlert({ variant: 'danger', message: "Erreur lors de la suppression" });
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwt.decode(token);

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
        await fetchGardes();
      }
    } catch (err) {
      console.error("Erreur handleApproval:", err);
      setAlert({
        variant: 'danger',
        message: err.response?.data?.message || "Erreur lors de l'opération"
      });
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
            {pendingRequests.length > 0 && (
              <Badge bg="danger" className="ms-2">
                {pendingRequests.length}
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
          </div>
        ) : (
          <>
            {showRequests && (
              <div className="mt-4">
                <h3>Demandes d'inscription</h3>
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
                  <p>Aucune demande en attente</p>
                )}
              </div>
            )}

            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="fr"
                events={events.map(e => ({
                  title: `${e.prenom} ${e.nom}`,
                  date: e.date,
                  extendedProps: e
                }))}
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
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="text" value={selectedDate} disabled />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Nom</Form.Label>
                    <Form.Control value={nom} onChange={(e) => setNom(e.target.value)} />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                {selectedEvent && (
                  <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
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