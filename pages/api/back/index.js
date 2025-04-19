import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB.js';
import ModelGarde from "@/pages/api/back/mod/gardeSchema";

dbConnect();
const router = createRouter();

// ➕ POST : inscription médecin + création automatique de garde
router.post(async (req, res) => {
  try {
    const data = req.body;

    const nouveauArticle = new ModelArticle({
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      specialite: data.specialite,
      email: data.email,
      password: data.password,
    });

    await nouveauArticle.save();

    // 🗓️ Création automatique d'une garde (exemple : demain)
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);

    const nouvelleGarde = new ModelGarde({
      nom: data.nom,
      prenom: data.prenom,
      specialite: data.specialite,
      date: demain,
    });

    await nouvelleGarde.save();

    console.log("Médecin + garde ajoutés :", nouveauArticle, nouvelleGarde);

    res.status(200).json({
      success: true,
      message: "Médecin et garde ajoutés avec succès",
      data: nouveauArticle,
      garde: nouvelleGarde
    });
  } catch (err) {
    console.error("Erreur dans POST :", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'inscription" });
  }
});

// 📥 GET : récupérer tous les médecins
router.get(async (req, res) => {
  const data = await ModelArticle.find();
  res.send(data);
});

// ✏️ PUT : modifier un médecin
router.put(async (req, res) => {
  try {
    const data = req.body;

    console.log("appel PUT");

    const oldArticle = await ModelArticle.findById(data._id);

    oldArticle.nom = data.nom;
    oldArticle.prenom = data.prenom;
    oldArticle.role = data.role;
    oldArticle.specialite = data.specialite;
    oldArticle.email = data.email;
    oldArticle.password = data.password;

    await oldArticle.save();

    res.send("PUT fonctionne correctement");
    console.log("fin appel PUT");
  } catch (err) {
    console.error("Erreur PUT :", err);
    res.status(500).send("Erreur lors de la modification");
  }
});

export default router.handler();
