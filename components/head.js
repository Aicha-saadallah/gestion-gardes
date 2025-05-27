"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { User } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function Header({ onLanguageChange, onRoleChange }) {
  const { i18n, t } = useTranslation("common");
  const [language, setLanguage] = useState(i18n.language || "fr");
  const [role, setRole] = useState("Médecin");
  const router = useRouter();

  const handleLanguageChange = () => {
    const newLang = language === "fr" ? "en" : "fr";
    setLanguage(newLang);
    router.push(router.pathname, router.asPath, { locale: newLang });
    onLanguageChange && onLanguageChange(newLang);
  };

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setRole(newRole);
    onRoleChange && onRoleChange(newRole);
  };

  const handleSignIn = () => {
    router.push("/front/login");
  };

  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Gestion des gardes</h1>

      <div style={styles.buttons}>
        <button onClick={handleLanguageChange} style={styles.button}>
          {t("buttons.language") || "Langue"} : {language.toUpperCase()}
        </button>
        <select onChange={handleRoleChange} value={role} style={styles.select}>
          <option value="Médecin">Médecin</option>
          <option value="superviseur">Superviseur</option>
          <option value="responsable de service">Responsable de service</option>
        </select>

        <button onClick={handleSignIn} style={styles.signInButton}>
          <span>{t("buttons.submit")}</span>
          <User size={20} style={{ marginLeft: "5px" }} />
        </button>
      </div>
    </header>
  );
}


const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
  },
  title: {
    margin: 0,
  },
  buttons: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  button: {
    padding: "5px 10px",
    border: "none",
    backgroundColor: "#fff",
    color: "#007bff",
    cursor: "pointer",
    borderRadius: "5px",
  },
  select: {
    padding: "5px",
    borderRadius: "5px",
    border: "none",
  },
  signInButton: {
    display: "flex",
    alignItems: "center",
    padding: "5px 10px",
    border: "none",
    backgroundColor: "#fff",
    color: "#007bff",
    cursor: "pointer",
    borderRadius: "5px",
    fontWeight: "bold",
  },
};
