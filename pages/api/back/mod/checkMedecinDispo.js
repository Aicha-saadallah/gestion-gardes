import dbConnect from "@/pages/api/back/model/connectDB";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
    }

    try {
        const { medecinId, date } = req.query;

        if (!medecinId || !mongoose.Types.ObjectId.isValid(medecinId)) {
            return res.status(400).json({ success: false, message: 'ID médecin invalide' });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date requise' });
        }

        const gardeDate = new Date(date);
        if (isNaN(gardeDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Date invalide' });
        }

        // Recherche si le médecin a déjà une garde ce jour-là
        const existingGarde = await ModelGarde.findOne({
            doctor: medecinId,
            date: {
                $gte: new Date(gardeDate.setHours(0, 0, 0, 0)),
                $lt: new Date(gardeDate.setHours(23, 59, 59, 999))
            }
        });

        return res.status(200).json({
            success: true,
            hasGarde: !!existingGarde,
            existingGarde: existingGarde || null
        });

    } catch (error) {
        console.error('Erreur:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
}