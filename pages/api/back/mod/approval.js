import dbConnect from '@/pages/api/back/model/connectDB';
import tableArticle from '@/pages/api/back/mod/articleSchemaDB';

export default async function handler(req, res) {
  const HTTP_METHODS = {
    GET: 'GET',
    PUT: 'PUT'
  };

  const allowedMethods = [HTTP_METHODS.GET, HTTP_METHODS.PUT];

  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({
      success: false,
      message: `Méthode ${req.method} non autorisée`
    });
  }

  try {
    await dbConnect();

    // GET - Récupérer les demandes
    if (req.method === HTTP_METHODS.GET) {
      const { service } = req.query;

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Le paramètre 'service' est requis"
        });
      }

      const pendingDoctors = await tableArticle.find({
        role: 'Médecin',
        service: service
      }).select('nom prenom email service createdAt').lean();

      return res.status(200).json({
        success: true,
        doctors: pendingDoctors,
        count: pendingDoctors.length
      });
    }

    // PUT - Traiter une demande
    if (req.method === HTTP_METHODS.PUT) {
      const { id, action, approverId } = req.body;

      // Validation des données
      if (!id || !['approve', 'reject'].includes(action) || !approverId) {
        return res.status(400).json({
          success: false,
          message: "Données invalides: ID, action ou approbateur manquant"
        });
      }

      // Vérifier que l'approbateur est chef de service
      const approver = await tableArticle.findOne({
        _id: approverId,
        role: 'Chef de service'
      });

      if (!approver) {
        return res.status(403).json({
          success: false,
          message: "Permission refusée - Approbateur non valide"
        });
      }

      // Mettre à jour le médecin
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        [action === 'approve' ? 'approvedAt' : 'rejectedAt']: new Date(),
        [action === 'approve' ? 'approvedBy' : 'rejectedBy']: approverId
      };

      const updatedDoctor = await tableArticle.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedDoctor) {
        return res.status(404).json({
          success: false,
          message: "Médecin non trouvé"
        });
      }

      return res.status(200).json({
        success: true,
        message: `Médecin ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
        doctor: updatedDoctor
      });
    }
  } catch (error) {
    console.error('Erreur API approval:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}