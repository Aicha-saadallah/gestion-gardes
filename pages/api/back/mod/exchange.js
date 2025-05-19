// pages/api/back/mod/exchange.js
import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB"; // Importez ModelArticle
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === "POST" && !req.query.id) {
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

            const exchange = await ModelEchange.findById(id).populate('gardeId fromDoctor toDoctor');
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
                if (exchange.gardeId) {
                    const gardeIdToGive = exchange.gardeId._id;
                    const fromDoctorId = exchange.fromDoctor._id;
                    const toDoctorId = exchange.toDoctor._id;
                    const gardeDate = exchange.gardeId.date; // Assuming gardeId has a 'date' field

                    // 1. Find the garde of the accepting doctor on the same date
                    const gardeToTake = await ModelGarde.findOne({ doctor: toDoctorId, date: gardeDate });

                    if (gardeToTake) {
                        const gardeIdToTake = gardeToTake._id;

                        // 2. Fetch the information of the doctors involved
                        const fromDoctor = await ModelArticle.findById(fromDoctorId);
                        const toDoctor = await ModelArticle.findById(toDoctorId);

                        if (!fromDoctor || !toDoctor) {
                            console.error("Erreur: Impossible de récupérer les informations des médecins.");
                            return res.status(500).json({ message: "Erreur lors de la récupération des informations des médecins." });
                        }

                        // 3. Update the garde of the requesting doctor to be assigned to the accepting doctor
                        const updateGiveResult = await ModelGarde.findByIdAndUpdate(
                            gardeIdToGive,
                            { doctor: toDoctorId, nom: toDoctor.nom, prenom: toDoctor.prenom },
                            { new: true }
                        );

                        if (!updateGiveResult) {
                            console.error(`Erreur: Impossible d'attribuer la garde ${gardeIdToGive} au médecin ${toDoctorId}`);
                            return res.status(500).json({ message: "Erreur lors de l'attribution de la garde au médecin acceptant." });
                        }
                        console.log(`Garde ${gardeIdToGive} attribuée au médecin ${toDoctorId} (${toDoctor.prenom} ${toDoctor.nom})`);

                        // 4. Update the garde of the accepting doctor to be assigned to the requesting doctor
                        const updateTakeResult = await ModelGarde.findByIdAndUpdate(
                            gardeIdToTake,
                            { doctor: fromDoctorId, nom: fromDoctor.nom, prenom: fromDoctor.prenom },
                            { new: true }
                        );

                        if (!updateTakeResult) {
                            console.error(`Erreur: Impossible d'attribuer la garde ${gardeIdToTake} au médecin ${fromDoctorId}`);
                            return res.status(500).json({ message: "Erreur lors de l'attribution de la garde au médecin demandeur." });
                        }
                        console.log(`Garde ${gardeIdToTake} attribuée au médecin ${fromDoctorId} (${fromDoctor.prenom} ${fromDoctor.nom})`);

                        // 5. Update other pending exchange requests for the involved gardes to 'annulé'
                        await ModelEchange.updateMany(
                            { gardeId: { $in: [gardeIdToGive, gardeIdToTake] }, _id: { $ne: id }, status: 'en attente' },
                            { status: 'annulé' }
                        );
                        console.log(`Autres demandes d'échange impliquant les gardes ${gardeIdToGive} et ${gardeIdToTake} annulées.`);

                    } else {
                        console.warn(`Avertissement: Aucune garde trouvée pour le médecin acceptant (${toDoctorId}) à la date du ${gardeDate}. L'échange n'a pas pu être complété.`);
                        return res.status(400).json({ message: "Aucune garde correspondante trouvée pour le médecin acceptant à cette date." });
                    }
                } else {
                    console.warn(`Avertissement: gardeId non trouvé pour la demande d'échange ${id}.`);
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
                    .populate('toDoctor', 'nom prenom')
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
                    .populate('fromDoctor', 'nom prenom')
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