//api/back/mod/garde.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelGarde from '@/pages/api/back/mod/gardeSchema';

dbConnect();
const router = createRouter();

router.get(async (req, res) => {
  try {
    const gardes = await ModelGarde.find();
    res.status(200).json({ success: true, gardes });
  } catch (err) {
    console.error("Erreur récupération gardes :", err);
    res.status(500).json({ success: false, message: "Erreur récupération gardes" });
  }
});

export default router.handler();
