import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelGarde from '@/pages/api/back/mod/gardeSchema';

dbConnect();

const router = createRouter();

// 📥 GET : récupérer toutes les gardes
router.get(async (req, res) => {
  try {
    const gardes = await ModelGarde.find();
    res.status(200).json({ success: true, gardes });
  } catch (err) {
    console.error("Erreur récupération gardes :", err);
    res.status(500).json({ success: false, message: "Erreur récupération gardes" });
  }
});

// ✏️ PUT : modifier une garde
router.put(async (req, res) => {
  try {
    const { id, nom, prenom, date } = req.body; // Récupérer les données à modifier du corps de la requête

    const updatedGarde = await ModelGarde.findByIdAndUpdate(
      id, // Rechercher la garde par son ID
      { nom, prenom, date }, // Les nouvelles données à mettre à jour
      { new: true, runValidators: true } // `new: true` retourne le document modifié, `runValidators` exécute les validations du schéma
    );

    if (!updatedGarde) {
      return res.status(404).json({ success: false, message: "Garde non trouvée" });
    }

    res.status(200).json({ success: true, message: "Garde modifiée avec succès", garde: updatedGarde });
  } catch (err) {
    console.error("Erreur modification garde :", err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification de la garde" });
  }
});
// ➕ POST : ajouter une nouvelle garde (accessible uniquement aux Chefs de service)
// ➕ POST : ajouter une nouvelle garde (accessible uniquement aux Chefs de service)
router.post(async (req, res) => {
  try {
    const { nom, prenom, date, service, doctorId } = req.body;

    // Vérifier si les données nécessaires sont présentes
    if (!nom || !prenom || !date || !service || !doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir toutes les informations nécessaires pour la garde.' 
      });
    }

    const nouvelleGarde = new ModelGarde({
      nom,
      prenom,
      date: new Date(date),
      service,
      doctor: doctorId, // Ajout du champ doctor requis
      statut: 'planifiée',
      createdBy: req.user?.id // Assurez-vous que l'ID de l'utilisateur est disponible
    });

    const savedGarde = await nouvelleGarde.save();
    res.status(201).json({ 
      success: true, 
      message: 'Garde ajoutée avec succès', 
      garde: savedGarde 
    });
  } catch (err) {
    console.error("Erreur ajout garde :", err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'ajout de la garde",
      error: err.message 
    });
  }
});

// 🗑️ DELETE : supprimer une garde
router.delete(async (req, res) => {
  try {
    const { id } = req.query; // Récupérer l'ID de la garde à supprimer des paramètres de la requête

    const deletedGarde = await ModelGarde.findByIdAndDelete(id);

    if (!deletedGarde) {
      return res.status(404).json({ success: false, message: "Garde non trouvée" });
    }

    res.status(200).json({ success: true, message: "Garde supprimée avec succès" });
  } catch (err) {
    console.error("Erreur suppression garde :", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de la garde" });
  }
});

export default router.handler();