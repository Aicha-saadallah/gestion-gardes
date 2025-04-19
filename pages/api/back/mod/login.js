
import dbConnect from "@/pages/api/back/model/connectDB";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  await dbConnect();

  try {
    const utilisateur = await ModelArticle.findOne({ email });

    if (!utilisateur) {
      return res.status(401).json({ success: false, message: "Email incorrect" });
    }

    if (utilisateur.password !== password) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
    }

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      role: utilisateur.role, // Tu peux rediriger selon ce rôle
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}
