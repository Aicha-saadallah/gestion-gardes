import dbConnect from "@/pages/api/back/model/connectDB";
import tableArticle from "@/pages/api/back/mod/articleSchemaDB";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";

export default async function handler(req, res) {
  try {
    console.log("✅ Requête reçue dans l'API");

    await dbConnect();
    console.log("......connexion avec succès");

    if (req.method === "POST") {
      const { nom, prenom, role, specialite, email, password } = req.body;

      console.log("📦 Données reçues :", req.body);

      // Vérification des champs obligatoires
      if (!nom || !prenom || !role || !email || !password || (role === "Médecin" && !specialite)) {
        console.log("⚠️ Champs manquants !");
        return res.status(400).json({
          success: false,
          message: "Tous les champs requis ne sont pas fournis.",
        });
      }

      // Vérifie si l'email existe déjà
      const existing = await tableArticle.findOne({ email });
      if (existing) {
        console.log("⚠️ Email déjà utilisé :", email);
        return res.status(400).json({
          success: false,
          message: "Email déjà utilisé.",
        });
      }

      // Création de l'utilisateur
      const newUser = await tableArticle.create({
        nom,
        prenom,
        role,
        specialite: role === "Médecin" ? specialite : "",
        email,
        password,
      });

      console.log("✅ Utilisateur créé :", newUser);

      // Si Médecin, ajouter une garde automatiquement
      if (role === "Médecin") {
        const gardes = await ModelGarde.find({ specialite }).sort({ date: -1 });
        const derniereDate = gardes.length > 0 ? gardes[0].date : new Date();
        const prochaineDate = new Date(derniereDate);
        prochaineDate.setDate(prochaineDate.getDate() + 1);

        await ModelGarde.create({
          nom,
          prenom,
          specialite,
          date: prochaineDate,
        });

        console.log("✅ Garde ajoutée pour le médecin :", prochaineDate);
      }

      return res.status(201).json({
        success: true,
        message: "Utilisateur inscrit avec succès",
        user: newUser,
      });

    } else {
      // Si la méthode n'est pas POST
      return res.status(405).json({
        success: false,
        message: "Méthode non autorisée",
      });
    }

  } catch (err) {
    console.error("❌ Erreur serveur :", err);

    // Gérer le cas d'un email déjà existant (erreur MongoDB de duplicata)
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
