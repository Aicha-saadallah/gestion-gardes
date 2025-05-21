import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  const handleError = (error, status = 500) => {
    console.error('Erreur:', error);
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur';
    return res.status(status).json({
      success: false,
      message: message
    });
  };

  try {
    // --- Créer une nouvelle demande d'échange (méthode POST, sans ID de demande) ---
    if (req.method === "POST" && !req.query.id) {
      const { gardesToGet, gardesToGive, fromDoctor, message } = req.body;

      if (!Array.isArray(gardesToGet) || gardesToGet.length === 0) {
        return handleError(new Error('Veuillez sélectionner au moins une garde à obtenir.'), 400);
      }
      if (!Array.isArray(gardesToGive) || gardesToGive.length === 0) {
        return handleError(new Error('Veuillez sélectionner au moins une garde à donner.'), 400);
      }
      if (!fromDoctor || !mongoose.Types.ObjectId.isValid(fromDoctor)) {
        return handleError(new Error('ID du médecin demandeur invalide ou manquant.'), 400);
      }

      const requester = await ModelArticle.findById(fromDoctor);
      if (!requester || !['Médecin', 'Chef de service', 'Superviseur'].includes(requester.role)) {
        return handleError(new Error('Seuls les médecins, chefs de service ou superviseurs peuvent proposer des échanges.'), 403);
      }

      const [gardesToGetDocs, gardesToGiveDocs] = await Promise.all([
        ModelGarde.find({ _id: { $in: gardesToGet } }).populate('doctor'),
        ModelGarde.find({ _id: { $in: gardesToGive } }).populate('doctor')
      ]);

      if (gardesToGetDocs.length !== gardesToGet.length || gardesToGiveDocs.length !== gardesToGive.length) {
        return handleError(new Error('Certaines gardes sélectionnées n\'ont pas été trouvées. L\'ID n\'existe peut-être plus.'), 404);
      }

      const invalidGardesToGive = gardesToGiveDocs.some(g => g.doctor._id.toString() !== fromDoctor.toString());
      if (invalidGardesToGive) {
        return handleError(new Error('Vous ne pouvez donner que vos propres gardes. Veuillez vérifier vos sélections.'), 400);
      }

      const invalidGardesToGet = gardesToGetDocs.some(g => g.doctor._id.toString() === fromDoctor.toString());
      if (invalidGardesToGet) {
        return handleError(new Error('Vous ne pouvez pas demander vos propres gardes. Sélectionnez une garde d\'un autre médecin.'), 400);
      }

      const allInvolvedGardeIds = [
        ...gardesToGet.map(id => new mongoose.Types.ObjectId(id)),
        ...gardesToGive.map(id => new mongoose.Types.ObjectId(id))
      ];

      const existingConflict = await ModelEchange.findOne({
        $or: [
          { gardesToGet: { $in: allInvolvedGardeIds } },
          { gardesToGive: { $in: allInvolvedGardeIds } }
        ],
        status: 'en attente'
      });

      if (existingConflict) {
        return handleError(new Error('Certaines gardes sont déjà impliquées dans un échange en attente. Veuillez vérifier vos sélections.'), 409);
      }

      const toDoctors = [...new Set(gardesToGetDocs.map(g => g.doctor._id.toString()))].map(id => new mongoose.Types.ObjectId(id));

      const newExchange = new ModelEchange({
        gardesToGet,
        gardesToGive,
        fromDoctor,
        toDoctors,
        message,
        status: 'en attente'
      });

      await newExchange.save();

      return res.status(201).json({
        success: true,
        message: 'Demande d\'échange créée avec succès. En attente de la réponse des autres médecins.',
        data: newExchange
      });
    }

    // --- Traiter une demande d'échange existante (méthode POST, avec ID de demande) ---
    else if (req.method === "POST" && req.query.id) {
      const { id } = req.query;
      const { action, userId } = req.body;

      if (!['accept', 'reject'].includes(action)) {
        return handleError(new Error('Action invalide. L\'action doit être "accept" ou "reject".'), 400);
      }
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return handleError(new Error('ID utilisateur invalide ou manquant pour traiter l\'échange.'), 400);
      }

      // Populate les données de gardes et de médecins (fromDoctor, toDoctors)
      const exchange = await ModelEchange.findById(id)
        .populate('gardesToGet', 'date service doctor nom prenom')
        .populate('gardesToGive', 'date service doctor nom prenom')
        .populate('fromDoctor', 'nom prenom role')
        .populate('toDoctors', 'nom prenom role');

      if (!exchange) {
        return handleError(new Error('Échange non trouvé.'), 404);
      }

      if (exchange.status !== 'en attente') {
        return handleError(new Error(`Cet échange a déjà été ${exchange.status}.`), 400);
      }

      const canRespond = exchange.toDoctors.some(d => d._id.toString() === userId.toString());
      if (!canRespond) {
        return handleError(new Error('Non autorisé. Seuls les médecins concernés par les gardes à obtenir peuvent répondre à cette demande.'), 403);
      }

      const respondingUser = await ModelArticle.findById(userId);
      if (!respondingUser || !['Médecin', 'Chef de service', 'Superviseur'].includes(respondingUser.role)) {
          return handleError(new Error('Seuls les médecins, chefs de service ou superviseurs peuvent accepter ou refuser les échanges.'), 403);
      }

      exchange.status = action === 'accept' ? 'accepté' : 'refusé';
      exchange.respondedAt = new Date();
      exchange.respondedBy = userId;

      if (action === 'accept') {
        // --- DÉPLACÉ : Récupérer les informations complètes du fromDoctor
        // et du respondingUser *AVANT* de démarrer la session de transaction
        const [fromDoctorData, respondingUserData] = await Promise.all([
            ModelArticle.findById(exchange.fromDoctor._id, 'nom prenom'),
            ModelArticle.findById(userId, 'nom prenom')
        ]);

        if (!fromDoctorData || !respondingUserData) {
            throw new Error('Informations de médecin manquantes pour l\'échange.');
        }
        // --- FIN DÉPLACEMENT ---

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const currentGardesToGet = exchange.gardesToGet;
          const currentGardesToGive = exchange.gardesToGive;

          const areGardesStillValid =
            currentGardesToGet.every(g => exchange.toDoctors.some(doc => doc._id.equals(g.doctor._id))) &&
            currentGardesToGive.every(g => g.doctor._id.equals(exchange.fromDoctor._id));

          if (!areGardesStillValid) {
            throw new Error('Les gardes impliquées dans l\'échange ont été modifiées ou ne sont plus disponibles. Transaction annulée.');
          }

          // Mise à jour des gardes données par le fromDoctor (qui vont au respondingUser)
          await ModelGarde.updateMany(
            { _id: { $in: currentGardesToGive.map(g => g._id) } },
            {
              $set: {
                doctor: userId,
                nom: respondingUserData.nom,
                prenom: respondingUserData.prenom
              }
            },
            { session } // Assurez-vous que l'opération est dans la transaction
          );

          // Mise à jour des gardes obtenues par le fromDoctor (qui viennent du respondingUser)
          await ModelGarde.updateMany(
            { _id: { $in: currentGardesToGet.map(g => g._id) } },
            {
              $set: {
                doctor: exchange.fromDoctor._id,
                nom: fromDoctorData.nom,
                prenom: fromDoctorData.prenom
              }
            },
            { session } // Assurez-vous que l'opération est dans la transaction
          );

          // Annuler les autres échanges en attente impliquant ces mêmes gardes
          const involvedGardeIds = [...currentGardesToGet.map(g => g._id), ...currentGardesToGive.map(g => g._id)];

          await ModelEchange.updateMany(
            {
              $or: [
                { gardesToGet: { $in: involvedGardeIds } },
                { gardesToGive: { $in: involvedGardeIds } }
              ],
              _id: { $ne: exchange._id },
              status: 'en attente'
            },
            { $set: { status: 'annulé', cancelledByExchange: exchange._id } },
            { session } // Assurez-vous que l'opération est dans la transaction
          );

          await session.commitTransaction();
          console.log('Transaction d\'échange réussie.');
        } catch (error) {
          await session.abortTransaction();
          console.error('Erreur lors de la transaction d\'échange:', error);
          throw error;
        } finally {
          session.endSession();
        }
      }

      await exchange.save();

      return res.status(200).json({
        success: true,
        message: `Demande d'échange ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès.`,
        data: exchange
      });
    }

    // --- Retrieve exchanges (GET method) ---
    else if (req.method === "GET") {
      const { userId } = req.query;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return handleError(new Error('ID utilisateur invalide ou manquant pour récupérer les échanges.'), 400);
      }

      const user = await ModelArticle.findById(userId);
      if (!user) {
          return handleError(new Error('Utilisateur non trouvé.'), 404);
      }

      const sentExchanges = await ModelEchange.find({ fromDoctor: userId })
          .populate('gardesToGet', 'date service')
          .populate('gardesToGive', 'date service')
          .populate('toDoctors', 'nom prenom')
          .sort({ createdAt: -1 });

      const receivedExchanges = await ModelEchange.find({ toDoctors: userId })
          .populate('gardesToGet', 'date service')
          .populate('gardesToGive', 'date service')
          .populate('fromDoctor', 'nom prenom')
          .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        exchangesSent: sentExchanges,
        exchangesReceived: receivedExchanges
      });
    }

    else {
      return handleError(new Error('Méthode non autorisée.'), 405);
    }

  } catch (error) {
    return handleError(error);
  }
}