import dbConnect from '@/pages/api/back/model/connectDB';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB';
export default async function handler(req, res) {
  await dbConnect();

  try {
    switch (req.method) {
      case 'GET':
        const admins = await ModelArticle.find({ role: 'admin' });
        return res.status(200).json({ admins });

      case 'POST':
        const existingAdmin = await ModelArticle.findOne({ email: req.body.email });
        if (existingAdmin) {
          return res.status(400).json({ message: 'Email déjà utilisé' });
        }
        const newAdmin = await ModelArticle.create({
          ...req.body,
          role: 'admin',
          isVerified: true,
          status: 'approved'
        });
        return res.status(201).json({ message: 'Admin créé', admin: newAdmin });

      case 'PUT':
        const { id } = req.query;
        const updatedAdmin = await ModelArticle.findByIdAndUpdate(
          id, 
          req.body, 
          { new: true }
        );
        if (!updatedAdmin) {
          return res.status(404).json({ message: 'Admin non trouvé' });
        }
        return res.status(200).json({ message: 'Admin mis à jour', admin: updatedAdmin });

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deletedAdmin = await ModelArticle.findByIdAndDelete(deleteId);
        if (!deletedAdmin) {
          return res.status(404).json({ message: 'Admin non trouvé' });
        }
        return res.status(200).json({ message: 'Admin supprimé' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
}