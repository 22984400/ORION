import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 👈 ajout
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CountryProvider } from "./contexts/CountryContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { supabase } from "./lib/supabase";
import "./index.css";

(window as any).supabase = supabase;

const queryClient = new QueryClient(); // 👈 création du client

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("L'élément #root est introuvable");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {" "}
      {/* 👈 wrapper */}
      <AuthProvider>
        <DatabaseProvider>
          <CountryProvider>
            <App />
          </CountryProvider>
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
