import dbConnect from '@/pages/api/back/model/connectDB';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB';
import jwt from 'jsonwebtoken';

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

    // Vérifier si le médecin est approuvé
    if (utilisateur.role === 'Médecin' && utilisateur.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: "Votre compte n'a pas encore été approuvé par le chef de service" 
      });
    }

    const token = jwt.sign({
      id: utilisateur._id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      service: utilisateur.service,
      email: utilisateur.email
    }, process.env.JWT_SECRET || 'votre_secret_jwt', { expiresIn: '8h' });

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role,
        service: utilisateur.service,
        email: utilisateur.email,
        status: utilisateur.status
      }
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: error.message 
    });
  }
}