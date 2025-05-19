import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";
import connectDB from "@/pages/api/back/model/connectDB";
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    try {
      const { service } = req.query;
      
      if (!service) {
        return res.status(400).json({ 
          success: false, 
          message: "Le paramètre service est requis" 
        });
      }

      // Recherche dans tableArticle
      const medecins = await ModelArticle.find({
        service: service,
        role: "Médecin",
        status: "approved"
      })
      .select("nom prenom _id email")
      .sort({ nom: 1, prenom: 1 });

      res.status(200).json({
        success: true,
        medecins: medecins.map(m => ({
          id: m._id,
          nom: m.nom,
          prenom: m.prenom,
          email: m.email
        }))
      });

    } catch (error) {
      console.error("Erreur API:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des médecins",
        error: error.message
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ 
      success: false, 
      message: `Méthode ${req.method} non autorisée` 
    });
  }
}