// pages/api/admin/inscription-admin.js
import dbConnect from '@/pages/api/back/model/connectDB';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await dbConnect();
      const data = req.body;

      if (data.role !== "admin" && data.role !== "Superviseur") {
        return res.status(400).json({ success: false, message: "Veuillez sélectionner un rôle valide." });
      }

      const nouvelAdminSuperviseur = new ModelArticle({
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        email: data.email,
        password: data.password,
        status: "approved", // Par défaut, approuver les admins/superviseurs (ajuster si nécessaire)
      });

      await nouvelAdminSuperviseur.save();

      res.status(200).json({ success: true, message: `${data.role} inscrit avec succès.`, data: nouvelAdminSuperviseur });

    } catch (error) {
      console.error("Erreur lors de l'inscription de l'administrateur/superviseur:", error);
      res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
    }
  } else {
    res.status(405).json({ message: 'Méthode non autorisée' });
  }
}