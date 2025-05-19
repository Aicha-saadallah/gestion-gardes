// pages/api/back/mod/exchange/[exchangeId]/[action].js
import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";

export default async function handler(req, res) {
  await dbConnect();
  const { exchangeId, action } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  if (!exchangeId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: "ID d'échange ou action invalide" });
  }

  try {
    const exchange = await ModelEchange.findById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ message: "Demande d'échange non trouvée" });
    }

    if (exchange.status !== "en attente") {
      return res.status(400).json({ message: "Cette demande d'échange a déjà été traitée." });
    }

    if (action === 'accept') {
      // Récupérer les détails de la garde et des médecins concernés
      const garde = await ModelGarde.findById(exchange.gardeId);
      const fromDoctor = await ModelArticle.findById(exchange.fromDoctor);
      const toDoctor = await ModelArticle.findById(exchange.toDoctor);

      if (!garde || !fromDoctor || !toDoctor) {
        return res.status(404).json({ message: "Informations de garde ou de médecin introuvables." });
      }

      // Mettre à jour le propriétaire de la garde
      garde.doctor = toDoctor._id;
      garde.nom = toDoctor.nom;
      garde.prenom = toDoctor.prenom;
      await garde.save();

      // Mettre à jour le statut de l'échange
      exchange.status = "accepté";
      await exchange.save();

      return res.status(200).json({ success: true, message: "Échange accepté avec succès." });
    } else if (action === 'reject') {
      exchange.status = "refusé";
      await exchange.save();
      return res.status(200).json({ success: true, message: "Échange refusé avec succès." });
    }

  } catch (error) {
    console.error(`Erreur lors de l'action ${action} sur l'échange ${exchangeId}:`, error);
    return res.status(500).json({ message: "Erreur serveur lors du traitement de la demande.", error: error.message });
  }
}