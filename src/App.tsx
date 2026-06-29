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

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ClientsPage = lazy(() =>
  import("./pages/clients/ClientsPage").then((m) => ({
    default: m.ClientsPage,
  })),
);
const EngagementsPage = lazy(() =>
  import("./pages/engagements/EngagementsPage").then((m) => ({
    default: m.EngagementsPage,
  })),
);
const ReviewNotesPage = lazy(() =>
  import("./pages/review-notes/ReviewNotesPage").then((m) => ({
    default: m.ReviewNotesPage,
  })),
);
const FindingsPage = lazy(() =>
  import("./pages/FindingsPage").then((m) => ({ default: m.FindingsPage })),
);
const WorkingPapersPage = lazy(() =>
  import("./pages/working-papers/WorkingPapersPage").then((m) => ({
    default: m.WorkingPapersPage,
  })),
);
const StockPage = lazy(() =>
  import("./pages/stock/StockPage").then((m) => ({ default: m.StockPage })),
);
const FixedAssetsPage = lazy(() =>
  import("./pages/fixed-assets/FixedAssetsPage").then((m) => ({
    default: m.FixedAssetsPage,
  })),
);
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
// ...
<Route path="/search" element={<SearchPage />} />;
const LeavePage = lazy(() =>
  import("./pages/leave/LeavePage").then((m) => ({ default: m.LeavePage })),
);
const TeamPage = lazy(() =>
  import("./pages/team/TeamPage").then((m) => ({ default: m.TeamPage })),
);
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const NotificationsPage = lazy(() =>
  import("./pages/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const Manuel = lazy(() => import("./pages/manuel/Manuel"));

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/signup"
          element={<Navigate to="/login?tab=signup" replace />}
        />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/engagements" element={<EngagementsPage />} />
          <Route path="/review-notes" element={<ReviewNotesPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/working-papers" element={<WorkingPapersPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/fixed-assets" element={<FixedAssetsPage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/manuel" element={<Manuel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
