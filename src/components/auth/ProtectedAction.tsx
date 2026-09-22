// src/components/auth/ProtectedAction.tsx
import type { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";
import type { ActionId, ModuleId } from "../../lib/permissions";

interface ProtectedActionProps {
  module: ModuleId;
  action: ActionId;
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * "alert" (default): button stays visible, alert on click if no permission
   * "hide": button is hidden completely if no permission
   */
  mode?: "alert" | "hide";
}

const ACTION_LABELS: Record<ActionId, string> = {
  create: "créer",
  view: "consulter",
  edit: "modifier",
  delete: "supprimer",
};

const MODULE_LABELS: Record<string, string> = {
  clients: "Clients",
  missions: "Missions",
  review_notes: "Notes de revue",
  findings: "Constats",
  besoins_cabinet: "Besoins cabinet",
  stock: "Stock",
  immobilisations: "Immobilisations",
  caisse: "Caisse",
  suivi_cac: "Suivi CAC",
  conges: "Congés",
  manuel: "Manuel",
  notes_frais: "Notes de frais",
  fournisseurs: "Fournisseurs",
  ressources_internes: "Ressources internes",
  collaborateurs: "Collaborateurs",
  factures: "Factures",
};

export function ProtectedAction({
  module,
  action,
  children,
  fallback = null,
  mode = "alert",
}: ProtectedActionProps) {
  const { can, role } = usePermission();

  // Permission granted → render children normally
  if (can(module, action)) {
    return <>{children}</>;
  }

  // mode="hide" → don't render the button
  if (mode === "hide") {
    return <>{fallback}</>;
  }

  // mode="alert" → keep the button but intercept clicks
  const isDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("orion_demo_mode") === "true";

  const hasNoRole =
    !role || role === "" || role === "null" || role === "undefined";

  const handleBlockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDemo) {
      alert(
        `🎭 Mode démo actif\n\n` +
          `Vous ne pouvez pas ${ACTION_LABELS[action]} dans le module "${
            MODULE_LABELS[module] || module
          }".\n\n` +
          `Le mode démo est en lecture seule — les modifications ne sont pas sauvegardées.`,
      );
      return;
    }

    if (hasNoRole) {
      alert(
        `⛔ Accès refusé\n\n` +
          `Vous devez être associé à un rôle avant de pouvoir ${ACTION_LABELS[action]} dans le module "${
            MODULE_LABELS[module] || module
          }".\n\n` +
          `Contactez votre administrateur ORION pour qu'il vous attribue un rôle.`,
      );
      return;
    }

    // Has a role but lacks the specific permission
    alert(
      `⛔ Permission insuffisante\n\n` +
        `Votre rôle actuel ne vous permet pas de ${ACTION_LABELS[action]} dans le module "${
          MODULE_LABELS[module] || module
        }".\n\n` +
        `Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.`,
    );
  };

  // Clone the child with an onClick that intercepts
  // Use a wrapper div with pointer-events trick
  return (
    <div
      onClickCapture={handleBlockedClick}
      style={{ display: "inline-block", cursor: "not-allowed" }}
      title={`Non autorisé — vous devez être associé à un rôle`}
    >
      <div
        style={{
          pointerEvents: "none",
          opacity: 0.55,
          filter: "grayscale(40%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
