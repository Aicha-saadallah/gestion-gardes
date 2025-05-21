// api/back/mod/serviceGarde.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB';

dbConnect();
const router = createRouter();

router.get(async (req, res) => {
  try {
    const { service, currentUserId } = req.query;

    // Validation
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Paramètre 'service' requis",
        data: { members: [] }
      });
    }

    // Récupération des médecins du service (excluant l'utilisateur actuel)
    const medecins = await ModelArticle.find({
      service,
      _id: { $ne: currentUserId },
      role: { $in: ['Médecin', 'Chef de service'] },
      status: 'approved'
    }).select('nom prenom _id role service'); // Assurez-vous que 'service' est sélectionné

    // Formatage réponse
    res.status(200).json({
      success: true,
      data: {
        members: medecins.map(m => ({
          id: m._id,
          nom: m.nom,
          prenom: m.prenom,
          role: m.role,
          service: m.service
        }))
      }
    });
  } catch (err) {
    console.error("Erreur GET /serviceGarde:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      data: { members: [] }
    });
  }
});

export default router.handler();