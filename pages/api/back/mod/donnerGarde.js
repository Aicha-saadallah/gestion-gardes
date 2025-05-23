import dbConnect from "@/pages/api/back/model/connectDB";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  const handleError = (error, status = 500) => {
    console.error('Erreur:', error);
    return res.status(status).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Erreur serveur'
    });
  };

  if (req.method !== "POST") {
    return handleError(new Error('Méthode non autorisée'), 405);
  }

  try {
    const actingUserId = req.headers['x-user-id'];
    const { gardeId, nouveauMedecinId, raison } = req.body;

    // Validation
    if (!actingUserId || !mongoose.Types.ObjectId.isValid(actingUserId)) {
      return handleError(new Error('ID utilisateur invalide'), 401);
    }
    if (!gardeId || !mongoose.Types.ObjectId.isValid(gardeId)) {
      return handleError(new Error('ID garde invalide'), 400);
    }
    if (!nouveauMedecinId || !mongoose.Types.ObjectId.isValid(nouveauMedecinId)) {
      return handleError(new Error('ID nouveau médecin invalide'), 400);
    }

    // Récupération des données
    const [currentUser, garde, nouveauMedecin] = await Promise.all([
      ModelArticle.findById(actingUserId),
      ModelGarde.findById(gardeId).populate('doctor'),
      ModelArticle.findById(nouveauMedecinId)
    ]);

    // Vérifications
    if (!currentUser) return handleError(new Error('Utilisateur non trouvé'), 404);
    if (!garde) return handleError(new Error('Garde non trouvée'), 404);
    if (!nouveauMedecin) return handleError(new Error('Médecin non trouvé'), 404);

    // Vérifications de date
    const gardeDate = new Date(garde.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Vérifier si la date est passée
    if (gardeDate < today) {
      return handleError(new Error("Impossible de modifier une garde dont la date est passée."), 400);
    }

    // 2. Vérifier qu'il reste au moins 1 jour avant la garde
    const oneDayBefore = new Date(gardeDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    if (today >= oneDayBefore) {
      return handleError(new Error("Les demandes doivent être faites au moins 1 jour avant la date de la garde."), 400);
    }

    // Autorisations
    const isOwner = String(garde.doctor._id) === String(currentUser._id);
    const isSupervisor = ['Chef de service', 'Superviseur', 'Admin'].includes(currentUser.role);
    
    if (!isOwner && !isSupervisor) {
      return handleError(new Error('Non autorisé à transférer cette garde'), 403);
    }

    // Création de la demande
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Créer une demande d'échange spéciale (sans gardesToGet)
      const newExchange = await ModelEchange.create([{
        fromDoctor: currentUser._id,
        toDoctors: [nouveauMedecinId],
        gardesToGive: [gardeId],
        message: raison || `Don de garde proposé par ${currentUser.prenom} ${currentUser.nom}`,
        status: 'en attente',
        isDon: true // Champ supplémentaire pour identifier les dons
      }], { session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: 'Demande de don envoyée. Le médecin doit accepter la proposition.',
        data: newExchange
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    return handleError(error);
  }
}