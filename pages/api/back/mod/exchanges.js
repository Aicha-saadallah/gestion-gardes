import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  await dbConnect(); // Connexion à la base de données

  try {
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ success: false, message: 'Non autorisé. Veuillez vous connecter.' });
    }

    // Vérification du rôle de l'utilisateur : Seul le 'Chef de service' peut accéder à ce point d'API
    const user = await ModelArticle.findById(token.id);
    if (!user || user.role !== 'Chef de service') {
      return res.status(403).json({ success: false, message: 'Accès refusé. Seuls les Chefs de service peuvent gérer les échanges.' });
    }

    // --- Requête GET : Lister les échanges
    if (req.method === 'GET') {
      const { status, service } = req.query;

      // Trouver tous les médecins du même service que le Chef de service authentifié
      const doctorsInService = await ModelArticle.find(
        { service: service || user.service, role: 'Médecin' },
        '_id' // Ne récupérer que l'ID
      );

      const doctorIds = doctorsInService.map(doc => doc._id);

      // Construire la requête pour trouver les échanges impliquant des médecins du service
      let query = {
        $or: [
          { fromDoctor: { $in: doctorIds } }, // Échanges initiés par un médecin du service
          { toDoctors: { $in: doctorIds } }    // Échanges où un médecin du service est destinataire
        ]
      };

      // Filtrer par statut si fourni et valide
      if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
        query.status = status;
      }

      const exchanges = await ModelEchange.find(query)
        .populate({
          path: 'gardesToGet',
          select: 'date nom prenom doctor service',
          populate: { path: 'doctor', select: 'nom prenom' } // Populer le médecin de la garde
        })
        .populate({
          path: 'gardesToGive',
          select: 'date nom prenom doctor service',
          populate: { path: 'doctor', select: 'nom prenom' } // Populer le médecin de la garde
        })
        .populate({
          path: 'fromDoctor',
          select: 'nom prenom service'
        })
        .populate({
          path: 'toDoctors',
          select: 'nom prenom service'
        })
        .populate({
          path: 'respondedBy',
          select: 'nom prenom'
        })
        .sort({ createdAt: -1 }); // Trier par les plus récents en premier

      return res.status(200).json({ success: true, exchanges });

    // --- Requête PUT : Gérer (accepter/refuser) un échange
    } else if (req.method === 'PUT') {
      const { exchangeId, decision } = req.body; // approverId est déjà disponible via token.id

      if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Action invalide. La décision doit être "approve" (accepter) ou "reject" (refuser).'
        });
      }

      // Populer les informations complètes pour la validation du service
      const exchange = await ModelEchange.findById(exchangeId)
        .populate('gardesToGet gardesToGive fromDoctor toDoctors');

      if (!exchange) {
        return res.status(404).json({
          success: false,
          message: 'Échange non trouvé.'
        });
      }

      // Vérifier que tous les médecins impliqués dans l'échange appartiennent au service du Chef de service
      const involvedDoctorIds = [exchange.fromDoctor._id, ...exchange.toDoctors.map(d => d._id)];
      const involvedDoctors = await ModelArticle.find({ _id: { $in: involvedDoctorIds } });

      const allDoctorsInSameService = involvedDoctors.every(d => d.service === user.service);

      if (!allDoctorsInSameService) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Cet échange n\'implique pas uniquement des médecins de votre service.'
        });
      }

      // S'assurer que l'échange est toujours en attente
      if (exchange.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cet échange a déjà été traité.'
        });
      }

      // Mettre à jour le statut de l'échange
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      exchange.status = newStatus;
      exchange.respondedAt = new Date();
      exchange.respondedBy = user._id; // L'ID du Chef de service authentifié

      if (decision === 'approve') {
        // Effectuer l'échange des gardes
        // Pour les gardes que le 'fromDoctor' donne, elles sont attribuées au premier 'toDoctor'
        // (Assumant un échange simple entre deux médecins. Si plusieurs `toDoctors` peuvent recevoir
        // des gardes spécifiques, une logique plus détaillée serait nécessaire).
        if (exchange.toDoctors.length > 0) {
            for (const garde of exchange.gardesToGive) {
                garde.doctor = exchange.toDoctors[0]; // Assigner la garde au premier destinataire
                await garde.save();
            }
        }

        // Pour les gardes que le 'fromDoctor' reçoit, elles lui sont attribuées
        for (const garde of exchange.gardesToGet) {
            garde.doctor = exchange.fromDoctor;
            await garde.save();
        }
      }

      await exchange.save();

      return res.status(200).json({
        success: true,
        message: `Échange ${newStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès.`,
        exchange
      });

    } else {
      // Méthode HTTP non autorisée
      return res.status(405).json({
        success: false,
        message: 'Méthode non autorisée. Seules les requêtes GET et PUT sont supportées.'
      });
    }
  } catch (error) {
    console.error('Erreur API exchanges:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur interne.',
      error: error.message
    });
  }
}