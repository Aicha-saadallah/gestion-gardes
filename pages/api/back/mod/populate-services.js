// pages/api/admin/populate-services.js
import dbConnect from '@/pages/api/back/model/connectDB';
import Service from '@/pages/api/back/mod/serviceSchema';
import allServicesData from '@/data/services';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await dbConnect();

      const insertedServices = await Service.insertMany(
        allServicesData.map(nom => ({ nom }))
      );

      res.status(200).json({ success: true, message: `${insertedServices.length} services ajoutés.`, data: insertedServices });
    } catch (error) {
      console.error("Erreur lors de la population des services :", error);
      res.status(500).json({ success: false, message: "Erreur lors de la population des services.", error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Méthode non autorisée. Utilisez POST pour peupler les services.' });
  }
}