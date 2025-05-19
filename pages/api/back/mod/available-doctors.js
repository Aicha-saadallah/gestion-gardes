import dbConnect from '@/pages/api/back/model/connectDB';
import tableArticle from '@/pages/api/back/mod/articleSchemaDB';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { service } = req.query;

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service manquant"
        });
      }

      // Trouver tous les médecins du même service avec un statut "approved"
      const doctors = await tableArticle.find({
        service: service,
        role: 'Médecin',
        status: 'approved'
      }).select('-password'); // Ne pas envoyer le mot de passe

      return res.status(200).json({
        success: true,
        doctors
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
