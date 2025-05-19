// pages/api/back/chefs-par-service.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB.js';

dbConnect();
const router = createRouter();

router.get(async (req, res) => {
  try {
    const chefsParService = await ModelArticle.aggregate([
      {
        $match: { role: "Chef de service" }
      },
      {
        $group: {
          _id: "$service"
        }
      },
      {
        $project: {
          _id: 0,
          service: "$_id"
        }
      }
    ]);

    res.status(200).json(chefsParService);
  } catch (error) {
    console.error("Erreur lors de la récupération des chefs par service :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des informations." });
  }
});

export default router.handler();