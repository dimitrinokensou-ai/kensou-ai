"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setMessage(
          "La session de récupération est introuvable. Demande un nouveau lien."
        );
      }

      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setMessage("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setMessage("Remplis les deux champs.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setMessage(
        "La session de récupération a expiré. Demande un nouveau lien."
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Mot de passe modifié avec succès !");
      setPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0f",
        color: "white",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
          borderRadius: "20px",
          background: "#15151c",
          border: "1px solid #2b2b35",
        }}
      >
        <h1 style={{ marginBottom: "10px" }}>
          Nouveau mot de passe
        </h1>

        <p style={{ color: "#aaa", marginBottom: "25px" }}>
          Choisis ton nouveau mot de passe Kensou AI.
        </p>

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "12px",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "#0f0f14",
            color: "white",
          }}
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "18px",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "#0f0f14",
            color: "white",
          }}
        />

        <button
          onClick={handleResetPassword}
          disabled={loading || checkingSession}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#000000",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {checkingSession
            ? "Vérification..."
            : loading
              ? "Modification..."
              : "Modifier le mot de passe"}
        </button>

        {message && (
          <p style={{ marginTop: "18px", color: "#ccc" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}