import dbConnect from "@/pages/api/back/model/connectDB";
import tableArticle from "@/pages/api/back/mod/articleSchemaDB";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";

export default async function handler(req, res) {
  try {
    console.log("✅ Requête reçue dans l'API d'inscription");

    await dbConnect();
    console.log("......connexion avec succès");

    if (req.method === "POST") {
      const { nom, prenom, role, service, email, password } = req.body;

      console.log("📦 Données reçues :", { 
        ...req.body, 
        password: password ? '*****' : null 
      });

      // Validation des champs
      if (!nom || !prenom || !role || !email || !password || (role === "Médecin" && !service)) {
        console.log("⚠️ Champs manquants !");
        return res.status(400).json({
          success: false,
          message: "Tous les champs requis ne sont pas fournis.",
        });
      }

      // Vérification email
      const existing = await tableArticle.findOne({ email });
      if (existing) {
        console.log("⚠️ Email déjà utilisé :", email);
        return res.status(400).json({
          success: false,
          message: "Email déjà utilisé.",
        });
      }

      // Création avec statut approprié
      const status = role === "Médecin" ? "pending" : "approved";
      const newUser = await tableArticle.create({
        nom,
        prenom,
        role,
        service: ["Médecin", "Chef de service"].includes(role) ? service : "",
        email,
        password,
        status
      });

      console.log("✅ Utilisateur créé :", {
        ...newUser._doc,
        password: '*****'
      });

      // Si médecin approuvé immédiatement (pour test)
      if (role === "Médecin" && status === "approved") {
        const gardes = await ModelGarde.find({ service }).sort({ date: -1 });
        const derniereDate = gardes.length > 0 ? gardes[0].date : new Date();
        const prochaineDate = new Date(derniereDate);
        prochaineDate.setDate(prochaineDate.getDate() + 1);

        await ModelGarde.create({
          nom,
          prenom,
          service,
          date: prochaineDate,
        });

        console.log("✅ Garde ajoutée pour le médecin :", prochaineDate);
      }

      return res.status(201).json({
        success: true,
        message: role === "Médecin" 
          ? "Demande d'inscription envoyée au chef de service pour approbation" 
          : "Utilisateur inscrit avec succès",
        user: newUser,
      });

    } else {
      return res.status(405).json({
        success: false,
        message: "Méthode non autorisée",
      });
    }

  } catch (err) {
    console.error("❌ Erreur serveur :", err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({
        success: false,
        message: "Email déjà utilisé (erreur de duplication).",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
}