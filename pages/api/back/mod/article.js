// pages/api/back/mod/article.js

import dbConnect from '@/pages/api/back/model/connectDB';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB';
export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const { id } = req.query;
      console.log("ID reçu par l'API:", id);

      if (id) {
        try {
          const member = await ModelArticle.findById(id);
          console.log("Médecin trouvé par ID:", member);
          if (member) {
            res.status(200).json({ members: [member] });
          } else {
            res.status(404).json({ message: 'Médecin non trouvé.' });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du médecin par ID:', error);
          res.status(500).json({ message: 'Erreur lors de la récupération du médecin.' });
        }
      } else {
        try {
          const members = await ModelArticle.find({ role: { $in: ['Médecin', 'Chef de service'] } });
          res.status(200).json({ members });
        } catch (error) {
          console.error('Erreur lors de la récupération des médecins:', error);
          res.status(500).json({ message: 'Erreur lors de la récupération des médecins.' });
        }
      }
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'L\'ID du médecin est requis pour la suppression.' });
      }
      try {
        const deletedMedecin = await ModelArticle.findByIdAndDelete(id);
        if (deletedMedecin) {
          res.status(200).json({ message: 'Médecin supprimé avec succès.' });
        } else {
          res.status(404).json({ message: 'Médecin non trouvé.' });
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du médecin:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du médecin.' });
      }
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const data = req.body;
      if (!id) {
        return res.status(400).json({ message: 'L\'ID du médecin est requis pour la mise à jour.' });
      }
      try {
        const updatedMedecin = await ModelArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (updatedMedecin) {
          res.status(200).json({ message: 'Médecin mis à jour avec succès.', medecin: updatedMedecin });
        } else {
          res.status(404).json({ message: 'Médecin non trouvé.' });
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du médecin:', error);
        res.status(400).json({ message: 'Erreur lors de la mise à jour du médecin.', error: error.errors });
      }
    } else if (req.method === 'POST') {
      try {
        const newMedecin = new ModelArticle(req.body);
        const savedMedecin = await newMedecin.save();
        res.status(200).json({ message: 'Médecin ajouté avec succès.', medecin: savedMedecin });
      } catch (error) {
        console.error('Erreur lors de l\'ajout du médecin:', error);
        res.status(400).json({ message: 'Erreur lors de l\'ajout du médecin.', error: error.errors });
      }
    } else {
      res.setHeader('Allow', ['GET', 'DELETE', 'PUT', 'POST']);
      res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    res.status(500).json({ message: 'Erreur de connexion à la base de données.' });
  }
}