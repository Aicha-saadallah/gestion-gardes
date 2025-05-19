import dbConnect from '@/pages/api/back/model/connectDB';
import ModelGarde from '@/pages/api/back/mod/gardeSchema';
import tableArticle from '@/pages/api/back/mod/articleSchemaDB';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { gardeId, newDoctorId } = req.body;
      const user = req.user; // From JWT middleware

      // Vérifier que la garde existe et appartient à l'utilisateur
      const garde = await ModelGarde.findById(gardeId);
      if (!garde || garde.doctor.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Non autorisé"
        });
      }

      // Vérifier que le nouveau médecin existe et est dans le même service
      const newDoctor = await tableArticle.findById(newDoctorId);
      if (!newDoctor || newDoctor.service !== user.service) {
        return res.status(400).json({
          success: false,
          message: "Médecin destinataire invalide"
        });
      }

      // Mettre à jour la garde
      garde.doctor = newDoctorId;
      garde.nom = newDoctor.nom;
      garde.prenom = newDoctor.prenom;
      await garde.save();

      // TODO: Envoyer notification email

      return res.status(200).json({
        success: true,
        message: "Garde transférée avec succès"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }

  return res.status(405).end();
}