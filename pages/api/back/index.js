// pages/api/back/index.js
import dbConnect from '@/pages/api/back/model/connectDB';
import { createRouter } from 'next-connect';
import ModelArticle from '@/pages/api/back/mod/articleSchemaDB.js';
import ModelGarde from "@/pages/api/back/mod/gardeSchema";

dbConnect();
const router = createRouter();

// ➕ POST : inscription utilisateur (médecin et chef de service) + création automatique de garde pour médecin
router.post(async (req, res) => {
  try {
    const data = req.body;

    // Vérification du rôle pour limiter à Médecin et Chef de service (sécurité supplémentaire côté serveur)
    if (data.role !== "Médecin" && data.role !== "Chef de service") {
      return res.status(400).json({ success: false, message: "Seuls les médecins et chefs de service peuvent s'inscrire via ce formulaire." });
    }

    // Vérification si un chef de service existe déjà pour ce service
    if (data.role === "Chef de service") {
      const chefExistant = await ModelArticle.findOne({ role: "Chef de service", service: data.service });
      if (chefExistant) {
        return res.status(409).json({ success: false, message: `S'il vous plaît, un chef de service existe déjà pour le service "${data.service}".` });
      }
    }

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
      console.log("Chef de service ajouté :", nouveauArticle);
      res.status(200).json({
        success: true,
        message: "Chef de service inscrit avec succès",
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