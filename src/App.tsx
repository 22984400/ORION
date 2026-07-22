// src/App.tsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthPage } from "./pages/auth/AuthPage";

// ========== FALLBACK ==========
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Chargement...</p>
      </div>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: "2rem",
        color: "red",
        background: "#1e1e2f",
        minHeight: "100vh",
      }}
    >
      <h2>Erreur de chargement</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {error.message}
      </pre>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  );
}

// ========== UTILITAIRE ==========
const lazyWithError = (importFn: () => Promise<any>) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error("Erreur de chargement du composant:", error);
      return { default: () => <ErrorFallback error={error} /> };
    }),
  );
};

// ========== PAGES PRINCIPALES (avec lazyWithError) ==========
const DashboardPage = lazyWithError(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ClientsPage = lazyWithError(() => import("./pages/clients/ClientsPage"));

const EngagementsPage = lazyWithError(() =>
  import("./pages/engagements/EngagementsPage").then((m) => ({
    default: m.EngagementsPage,
  })),
);
const ReviewNotesPage = lazyWithError(() =>
  import("./pages/review-notes/ReviewNotesPage").then((m) => ({
    default: m.ReviewNotesPage,
  })),
);
const FindingsPage = lazyWithError(() =>
  import("./pages/FindingsPage").then((m) => ({ default: m.FindingsPage })),
);
const WorkingPapersPage = lazyWithError(() =>
  import("./pages/working-papers/WorkingPapersPage").then((m) => ({
    default: m.WorkingPapersPage,
  })),
);
const StockPage = lazyWithError(() =>
  import("./pages/stock/StockPage").then((m) => ({ default: m.StockPage })),
);
const FixedAssetsPage = lazyWithError(() =>
  import("./pages/fixed-assets/FixedAssetsPage").then((m) => ({
    default: m.FixedAssetsPage,
  })),
);
const SearchPage = lazyWithError(() => import("./pages/search/SearchPage"));
const LeavePage = lazyWithError(() =>
  import("./pages/leave/LeavePage").then((m) => ({ default: m.LeavePage })),
);
const TeamPage = lazyWithError(() =>
  import("./pages/team/TeamPage").then((m) => ({ default: m.TeamPage })),
);
const ReportsPage = lazyWithError(() => import("./pages/reports/ReportsPage"));
const NotificationsPage = lazyWithError(() =>
  import("./pages/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const Manuel = lazyWithError(() => import("./pages/manuel/Manuel"));
const NoteDeFrais = lazyWithError(() => import("./pages/noteDeFrais/index"));

// ========== COLLABORATEURS ==========
const CollaborateurFiche = lazyWithError(
  () => import("./pages/collaborateurs/CollaborateurFiche"),
);
const CollaborateurList = lazyWithError(() =>
  import("./pages/collaborateurs/CollaborateurList").then((m) => ({
    default: m.CollaborateurList,
  })),
);

// ========== FACTURES (INVOICES) ==========
const InvoicesPage = lazyWithError(
  () => import("./pages/facture/InvoicesPage"),
);
const InvoiceDetailPage = lazyWithError(
  () => import("./pages/facture/InvoiceDetailPage"),
);
const InvoiceFormPage = lazyWithError(
  () => import("./pages/facture/InvoiceFormPage"),
);

// ========== SUIVI CAC ==========
const CACFollowUpPage = lazyWithError(() =>
  import("./pages/cac/CACFollowUpPage").then((m) => ({
    default: m.default,
  })),
);
const ResourcesPage = lazyWithError(() =>
  import("./pages/resources/ResourcesPage").then((m) => ({
    default: m.ResourcesPage,
  })),
);

const FournisseursPage = lazyWithError(() =>
  import("./pages/fournisseur/FournisseursPage").then((m) => ({
    default: m.FournisseursPage,
  })),
);

const ProfilePage = lazyWithError(() =>
  import("./pages/profile/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);

import { CaissePage } from "./pages/caisse/CaissePage";
// ========== APPLICATION SHELL ==========
function AppShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

// ========== COMPOSANT PRINCIPAL ==========
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/signup"
          element={<Navigate to="/login?tab=signup" replace />}
        />

        {/* Routes protégées */}
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/engagements" element={<EngagementsPage />} />
          <Route path="/review-notes" element={<ReviewNotesPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/working-papers" element={<WorkingPapersPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/fixed-assets" element={<FixedAssetsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/manuel" element={<Manuel />} />
          <Route path="/note-de-frais" element={<NoteDeFrais />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/caisse" element={<CaissePage />} />
          {/* Collaborateurs */}
          <Route path="/collaborateurs" element={<CollaborateurList />} />
          <Route path="/collaborateurs/new" element={<CollaborateurFiche />} />
          <Route path="/collaborateurs/:id" element={<CollaborateurFiche />} />
          <Route path="/fournisseurs" element={<FournisseursPage />} />
          {/* Factures */}
          <Route path="/factures" element={<InvoicesPage />} />
          <Route path="/factures/new" element={<InvoiceFormPage />} />
          <Route path="/factures/:id" element={<InvoiceDetailPage />} />
          <Route path="/factures/:id/edit" element={<InvoiceFormPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Suivi CAC */}
          <Route path="/cac-suivi" element={<CACFollowUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
