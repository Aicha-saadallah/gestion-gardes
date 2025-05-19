import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '@/styles/adminList.module.css'; // Assurez-vous que le chemin est correct
import { useRouter } from 'next/router';

// Composant de Modale pour Ajouter/Modifier un Admin (avec styles améliorés)
const AdminModal = ({ isOpen, onClose, onSubmit, formData, setFormData, editingId }) => {
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{editingId ? 'Modifier' : 'Ajouter'} un administrateur</h2>
        <form onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="nom" className={styles.formLabel}>Nom:</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="prenom" className={styles.formLabel}>Prénom:</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleInputChange}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={styles.formInput}
              disabled={!!editingId}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Mot de passe:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingId}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get('/api/back/mod/articlee?role=admin');
      setAdmins(data.admins);
      setError('');
    } catch (err) {
      setError('Échec du chargement des administrateurs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/back/mod/articlee?id=${editingId}`, formData);
      } else {
        await axios.post('/api/back/mod/articlee', formData);
      }
      fetchAdmins();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'opération.');
    }
  };

  const handleAddAdmin = () => {
    setFormData({ nom: '', prenom: '', email: '', password: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (admin) => {
    setFormData({
      nom: admin.nom,
      prenom: admin.prenom,
      email: admin.email,
      password: '' // Ne pas afficher le mot de passe existant
    });
    setEditingId(admin._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;
    try {
      await axios.delete(`/api/back/mod/articlee?id=${id}`);
      fetchAdmins();
    } catch (err) {
      setError('Échec de la suppression de l\'administrateur.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ nom: '', prenom: '', email: '', password: '' });
    setEditingId(null);
  };

  const handleGoBack = () => {
    router.push('/front/superviseur');
  };

  if (loading) return <div className={styles.loadingContainer}>Chargement des administrateurs...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestion des Administrateurs</h1>

      {error && <p className={styles.error}>{error}</p>}

      <button onClick={handleAddAdmin} className={styles.addButton}>
        Ajouter un administrateur
      </button>

      {/* Fenêtre modale */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
      />

      {/* Liste des admins */}
      <div className={styles.listContainer}>
        <h2 className={styles.listTitle}>Liste des administrateurs</h2>
        {admins.length === 0 ? (
          <p className={styles.emptyList}>Aucun administrateur trouvé.</p>
        ) : (
          <table className={styles.adminTable}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeader}>Nom</th>
                <th className={styles.tableHeader}>Email</th>
                <th className={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {admins.map(admin => (
                <tr key={admin._id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{admin.prenom} {admin.nom}</td>
                  <td className={styles.tableCell}>{admin.email}</td>
                  <td className={styles.tableActions}>
                    <button
                      onClick={() => handleEdit(admin)}
                      className={styles.editButton}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(admin._id)}
                      className={styles.deleteButton}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={handleGoBack} className={styles.backButton}>
        Retour au Planning
      </button>
    </div>
  );
};

export default AdminList;