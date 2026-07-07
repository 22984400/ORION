import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CountryProvider } from "./contexts/CountryContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { supabase } from "./lib/supabase"; // 👈 ajoute cet import
import "./index.css";

// 👈 ajoute cette ligne pour exposer le client sur window
(window as any).supabase = supabase;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("L'élément #root est introuvable");

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <DatabaseProvider>
        <CountryProvider>
          <App />
        </CountryProvider>
      </DatabaseProvider>
    </AuthProvider>
  </StrictMode>,
);
