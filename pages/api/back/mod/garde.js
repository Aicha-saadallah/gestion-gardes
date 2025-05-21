// api/back/mod/garde.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelGarde from '@/pages/api/back/mod/gardeSchema';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB'; // Pour vérifier les médecins

dbConnect();
const router = createRouter();

// GET - Récupérer toutes les gardes (existant)
router.get(async (req, res) => {
  try {
    const gardes = await ModelGarde.find();
    res.status(200).json({ success: true, gardes });
  } catch (err) {
    console.error("Erreur récupération gardes :", err);
    res.status(500).json({ success: false, message: "Erreur récupération gardes" });
  }
});

// POST - Créer une nouvelle garde
router.post(async (req, res) => {
  try {
    const { nom, prenom, date, service, doctorId } = req.body;

    // Validation des données requises
    if (!nom || !prenom || !date || !service || !doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires (nom, prenom, date, service, doctorId)'
      });
    }

    // Vérifier que le médecin existe et appartient au bon service
    const doctor = await ModelArticle.findOne({
      _id: doctorId,
      role: 'Médecin',
      service: service
    });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Médecin non trouvé dans ce service'
      });
    }

    // Créer la nouvelle garde
    const nouvelleGarde = new ModelGarde({
      nom,
      prenom,
      date: new Date(date),
      service,
      doctor: doctorId
    });

    const savedGarde = await nouvelleGarde.save();

    res.status(201).json({
      success: true,
      message: 'Garde créée avec succès',
      garde: savedGarde
    });

  } catch (err) {
    console.error("Erreur création garde :", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la garde",
      error: err.message
    });
  }
});

// PUT - Modifier une garde existante
router.put(async (req, res) => {
  try {
    const { id, nom, prenom, date } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de la garde requis'
      });
    }

    // Vérifier que la garde existe
    const existingGarde = await ModelGarde.findById(id);
    if (!existingGarde) {
      return res.status(404).json({
        success: false,
        message: 'Garde non trouvée'
      });
    }

    // Mettre à jour la garde
    const updatedGarde = await ModelGarde.findByIdAndUpdate(
      id,
      { nom, prenom, date: new Date(date) },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Garde modifiée avec succès',
      garde: updatedGarde
    });

  } catch (err) {
    console.error("Erreur modification garde :", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de la garde",
      error: err.message
    });
  }
});

// DELETE - Supprimer une garde
router.delete(async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de la garde requis'
      });
    }

    // Vérifier que la garde existe
    const garde = await ModelGarde.findById(id);
    if (!garde) {
      return res.status(404).json({
        success: false,
        message: 'Garde non trouvée'
      });
    }

    // Supprimer la garde
    await ModelGarde.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Garde supprimée avec succès'
    });

  } catch (err) {
    console.error("Erreur suppression garde :", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la garde",
      error: err.message
    });
  }
});

export default router.handler();