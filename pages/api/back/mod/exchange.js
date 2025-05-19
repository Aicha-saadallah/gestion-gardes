// pages/api/back/mod/exchange.js
import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === "POST") {
        const { gardeIds, fromDoctor, toDoctor, message, status } = req.body;

        try {
            if (!Array.isArray(gardeIds) || gardeIds.some(id => !mongoose.Types.ObjectId.isValid(id)) || !mongoose.Types.ObjectId.isValid(fromDoctor) || !mongoose.Types.ObjectId.isValid(toDoctor)) {
                return res.status(400).json({ message: 'ID de garde, d\'expéditeur ou de destinataire invalide' });
            }

            const createdExchanges = [];
            for (const gardeId of gardeIds) {
                const nouvelleEchange = new ModelEchange({
                    gardeId: gardeId,
                    fromDoctor: fromDoctor,
                    toDoctor: toDoctor,
                    message: message,
                    status: status || 'en attente',
                });
                const savedExchange = await nouvelleEchange.save();
                createdExchanges.push(savedExchange);
            }

            return res.status(201).json({ success: true, message: 'Demandes d\'échange créées avec succès.', data: createdExchanges });

        } catch (error) {
            console.error("Erreur lors de la création des demandes d'échange:", error);
            return res.status(500).json({ message: "Erreur serveur lors de la création des demandes.", error: error.message });
        }
    } else if (req.method === "POST" && req.query.id && (req.query.action === 'accept' || req.query.action === 'reject')) {
        const { id, action } = req.query;

        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID de demande d\'échange invalide' });
            }

            const exchange = await ModelEchange.findById(id);
            if (!exchange) {
                return res.status(404).json({ message: 'Demande d\'échange non trouvée.' });
            }

            if (exchange.status !== 'en attente') {
                return res.status(400).json({ message: 'Cette demande d\'échange a déjà été traitée.' });
            }

            const updatedExchange = await ModelEchange.findByIdAndUpdate(
                id,
                { status: action === 'accept' ? 'accepté' : 'refusé' },
                { new: true }
            );

            if (action === 'accept') {
                const fullExchange = await ModelEchange.findById(id).populate('gardeId');
                if (fullExchange?.gardeId) {
                    const garde = fullExchange.gardeId;
                    const toDoctorId = fullExchange.toDoctor;

                    await ModelGarde.findByIdAndUpdate(garde._id, { doctor: toDoctorId });
                    console.log(`Garde ${garde._id} attribuée au médecin ${toDoctorId}`);
                }
            }

            return res.status(200).json({ success: true, message: `Demande d'échange ${action}ée avec succès.` });

        } catch (error) {
            console.error(`Erreur lors de l'${action} de la demande d'échange:`, error);
            return res.status(500).json({ message: `Erreur serveur lors de l'${action} de la demande.`, error: error.message });
        }
    } else if (req.method === "GET") {
        const { fromDoctor, toDoctor } = req.query;

        try {
            let exchangesSent = [];
            if (fromDoctor) {
                exchangesSent = await ModelEchange.find({ fromDoctor })
                    .populate('gardeId', 'date')
                    .populate('toDoctor', 'prenom nom')
                    .sort({ createdAt: -1 });
            }

            let exchangesReceived = [];
            if (toDoctor) {
                if (!mongoose.Types.ObjectId.isValid(toDoctor)) {
                    return res.status(400).json({ message: 'ID médecin invalide' });
                }
                const doctorId = new mongoose.Types.ObjectId(toDoctor);
                exchangesReceived = await ModelEchange.find({ toDoctor: doctorId })
                    .populate('gardeId', 'date')
                    .populate('fromDoctor', 'prenom nom')
                    .sort({ createdAt: -1 });
            }

            return res.status(200).json({ exchangesSent, exchangesReceived });
        } catch (error) {
            console.error("Erreur dans exchange.js (GET):", error);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération des échanges", error: error.message });
        }
    } else {
        return res.status(405).json({ message: "Méthode non autorisée" });
    }
}