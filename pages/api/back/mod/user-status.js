import dbConnect from '@/pages/api/back/model/connectDB';
import tableArticle from '@/pages/api/back/mod/articleSchemaDB';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email non fourni" });
    }

    try {
      const user = await tableArticle.findOne({ email }).select('status role');
      
      if (!user) {
        return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
      }

      return res.status(200).json({
        success: true,
        status: user.status,
        role: user.role
      });
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erreur serveur",
        error: err.message 
      });
    }
  }

  return res.status(405).json({ message: 'Méthode non autorisée' });
}