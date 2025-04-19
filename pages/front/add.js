import style from "@/styles/inscription.module.css";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Header from "@/components/head";

export default function Acceuil() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [role, setRole] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  const router = useRouter();

  async function ajouterInfo() {
    try {
      const response = await axios.post("/api/back", {
        nom,
        prenom,
        role,
        specialite: role === "Médecin" ? specialite : "",
        email,
        password,
      });

      console.log("📡 Réponse :", response.data);

      if (response.data.success) {
        console.log("role ====>", role)
        setMessage({ type: "success", text: "✔️ Inscription réussie !" });
        setTimeout(() => {
          if (role === "Admin") {
            router.push("/admin/dashboard");
          } else if (role === "Médecin") {
            router.push("/front/medecin");
          } else if (role === "chef_service") {
            router.push("/front/service");
          } else {
            router.push("/login");
          }
        }, 2000);
      } else {
        setMessage({ type: "error", text: `❌ ${response.data.message || "Erreur lors de l'inscription"}` });
      }
    } catch (error) {
      console.log("⚠️ Erreur requête :", error.response?.data || error.message);
      setMessage({ type: "error", text: `❌ ${error.response?.data?.message || "Erreur lors de l'inscription"}` });
    }
  }

  return (
    <>
      <Header />
      <div className={style.container}>
        <div className={style.formContainer}>
          <h2 className={style.title}>Inscription</h2>

          {message && (
            <div className={`${style.message} ${message.type === "success" ? style.success : style.error}`}>
              {message.text}
            </div>
          )}

          <div className={style.form}>
            <div className={style.inputGroup}>
              <label>Nom :</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>

            <div className={style.inputGroup}>
              <label>Prénom :</label>
              <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </div>

            <div className={style.inputGroup}>
              <label>Rôle :</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="">Sélectionnez un rôle</option>
                <option value="Médecin">Médecin</option>
                <option value="Admin">Admin</option>
                <option value="Responsable">Responsable</option>
              </select>
            </div>

            {role === "Médecin" && (
              <div className={style.inputGroup}>
                <label>Spécialité :</label>
                <input type="text" value={specialite} onChange={(e) => setSpecialite(e.target.value)} required />
              </div>
            )}

            <div className={style.inputGroup}>
              <label>Email :</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className={style.inputGroup}>
              <label>Mot de passe :</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button onClick={ajouterInfo} className={style.submitButton}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
