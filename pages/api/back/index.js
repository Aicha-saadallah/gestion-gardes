// pages/api/back/index.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB.js';
import ModelGarde from "@/pages/api/back/mod/gardeSchema";

dbConnect();
const router = createRouter();

// ➕ POST : inscription utilisateur (tous rôles) + création automatique de garde pour médecin
router.post(async (req, res) => {
  try {
    const data = req.body;

    const nouveauArticle = new ModelArticle({
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      service: data.service,
      email: data.email,
      password: data.password,
      status: data.role === "Médecin" ? "pending" : "approved", // Définir le statut initial
    });

    await nouveauArticle.save();

    // 🗓️ Création automatique d'une garde pour les médecins (exemple : dans une semaine)
    if (data.role === "Médecin") {
      const dansUneSemaine = new Date();
      dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);

      const nouvelleGarde = new ModelGarde({
        nom: data.nom,
        prenom: data.prenom,
        service: data.service,
        date: dansUneSemaine,
        doctor: nouveauArticle._id,
      });

      await nouvelleGarde.save();

      console.log("Médecin + garde ajoutés :", nouveauArticle, nouvelleGarde);

      res.status(200).json({
        success: true,
        message: "Demande d'inscription envoyée et garde planifiée",
        data: nouveauArticle,
        garde: nouvelleGarde
      });
    } else {
      console.log("Utilisateur ajouté :", nouveauArticle);
      res.status(200).json({
        success: true,
        message: "Utilisateur inscrit avec succès",
        data: nouveauArticle,
      });
    }
  } catch (err) {
    console.error("Erreur dans POST :", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'inscription" });
  }
});

// 📥 GET : récupérer tous les utilisateurs
router.get(async (req, res) => {
  const data = await ModelArticle.find();
  res.send(data);
});

// ✏️ PUT : modifier un utilisateur
router.put(async (req, res) => {
  try {
    const data = req.body;

    console.log("appel PUT");

    const oldArticle = await ModelArticle.findById(data._id);

    oldArticle.nom = data.nom;
    oldArticle.prenom = data.prenom;
    oldArticle.role = data.role;
    oldArticle.service = data.service;
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