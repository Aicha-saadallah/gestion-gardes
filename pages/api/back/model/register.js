import connectDB from "@/pages/api/back/model/connectDB";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";  
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const { db } = await connectDB();
    const user = await db.collection('MdelArticle').findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Ici, vous devriez utiliser bcrypt pour comparer les mots de passe
    // Pour l'exemple, je fais une comparaison simple (non sécurisée)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Si tout est bon, retourner les infos nécessaires
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom
    };

    // Dans une vraie application, générez un token JWT ici
    const token = 'generated-jwt-token';

    res.status(200).json({ 
      success: true, 
      token,
      role: user.role,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}
