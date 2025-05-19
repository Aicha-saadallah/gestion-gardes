// pages/api/back/mod/mesEchanges.js
import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { fromDoctor } = req.query;
      
      if (!fromDoctor) {
        return res.status(400).json({ 
          success: false, 
          message: "Paramètre fromDoctor requis" 
        });
      }

      const echanges = await ModelEchange.find({ fromDoctor })
        .populate('gardeId', 'date service nom prenom')
        .populate('toDoctor', 'nom prenom service')
        .populate('fromDoctor', 'nom prenom service')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: echanges });
    } catch (error) {
      console.error("Erreur:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erreur serveur" 
      });
    }
  } else {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }
}