// src/lib/permissions.ts
// ============================================================
// MATRICE DES PERMISSIONS — SOURCE UNIQUE DE VÉRITÉ
// Issue du fichier Excel ORION
// X = autorisé ; absent = non autorisé
// ============================================================

export type PermissionAction = "create" | "view" | "edit" | "delete";

export interface ModulePermissions {
  create: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissions = Record<string, ModulePermissions>;
export type PermissionMatrix = Record<string, RolePermissions>;

// ============================================================
// MODULES (16)
// ============================================================
export const MODULES = [
  "clients",
  "missions",
  "review_notes",
  "findings",
  "besoins_cabinet",
  "stock",
  "immobilisations",
  "caisse",
  "suivi_cac",
  "conges",
  "manuel",
  "notes_frais",
  "fournisseurs",
  "ressources_internes",
  "collaborateurs",
  "factures",
] as const;

export const ACTIONS = ["create", "view", "edit", "delete"] as const;

export const POSTES = [
  "super_admin",
  "assistant_administratif",
  "rh",
  "responsable_controle_interne",
  "responsable_admin_fin",
  "associe_gerant",
  "directeur_bureau",
  "manageur",
  "chef_mission",
  "superviseur",
  "senior_audit",
  "senior_expertise",
  "junior_audit",
  "junior_expertise",
  "stagiaires",
  "formateur_senior",
  "formateur_junior",
] as const;

export type ModuleId = (typeof MODULES)[number];
export type ActionId = (typeof ACTIONS)[number];
export type PosteId = (typeof POSTES)[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
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

export const ACTION_LABELS: Record<ActionId, string> = {
  create: "Créer",
  view: "Voir",
  edit: "Modifier",
  delete: "Supprimer",
};

// ============================================================
// HELPERS
// ============================================================
const P = (c: boolean, v: boolean, e: boolean, d: boolean): ModulePermissions => ({
  create: c, view: v, edit: e, delete: d,
});
const NONE = P(false, false, false, false);
const FULL = P(true, true, true, true);

// ============================================================
// MATRICE — données issues directement du fichier Excel ORION
// ============================================================
export const PERMISSION_MATRIX: PermissionMatrix = {
  // ============ Assistant Administratif ============
  assistant_administratif: {
    clients:             FULL,
    missions:            NONE,
    review_notes:        NONE,
    findings:            FULL,
    besoins_cabinet:     P(true,  true,  false, false),
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              P(false, true,  true,  false),
    notes_frais:         P(true,  false, false, false),
    fournisseurs:        P(false, true,  false, false),
    ressources_internes: P(true,  true,  true,  false),
    collaborateurs:      P(false, true,  true,  false),
    factures:            P(false, true,  true,  true),
  },

  // ============ RH ============
  rh: {
    clients:             NONE,
    missions:            NONE,
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              FULL,
    manuel:              P(true,  true,  false, false),
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      FULL,
    factures:            NONE,
  },

  // ============ Responsable Contrôle Interne ============
  responsable_controle_interne: {
    clients:             P(false, true,  false, false),
    missions:            NONE,
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  false, false),
    suivi_cac:           P(true,  true,  false, false),
    conges:              P(false, true,  false, false),
    manuel:              NONE,
    notes_frais:         P(true,  true,  true,  false),
    fournisseurs:        NONE,
    ressources_internes: P(false, true,  false, false),
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Responsable Administratif et Financier ============
  responsable_admin_fin: {
    clients:             P(false, true,  false, false),
    missions:            NONE,
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  true,  false),
    suivi_cac:           P(true,  true,  false, false),
    conges:              P(true,  true,  false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        P(false, true,  false, false),
    ressources_internes: P(false, true,  false, false),
    collaborateurs:      P(false, true,  false, false),
    factures:            P(true,  true,  false, false),
  },

  // ============ Associé Gérant ============
  associe_gerant: {
    clients:             FULL,
    missions:            P(true,  true,  false, true),
    review_notes:        FULL,
    findings:            P(false, true,  true,  true),
    besoins_cabinet:     P(true,  true,  true,  false),
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  false, false),
    suivi_cac:           P(true,  false, false, false),
    conges:              P(true,  true,  true,  false),
    manuel:              NONE,
    notes_frais:         P(true,  true,  false, false),
    fournisseurs:        P(false, true,  false, false),
    ressources_internes: P(false, true,  false, false),
    collaborateurs:      P(false, true,  false, false),
    factures:            FULL,
  },

  // ============ Directeur du Bureau ============
  directeur_bureau: {
    clients:             NONE,
    missions:            FULL,
    review_notes:        P(true,  true,  false, false),
    findings:            P(true,  true,  false, false),
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  false, false),
    suivi_cac:           FULL,
    conges:              FULL,
    manuel:              NONE,
    notes_frais:         P(false, true,  false, false),
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(true,  true,  false, false),
    factures:            FULL,
  },

  // ============ Manager ============
  manageur: {
    clients:             NONE,
    missions:            P(true,  true,  true,  false),
    review_notes:        P(true,  true,  true,  false),
    findings:            P(true,  true,  false, false),
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  true,  false),
    suivi_cac:           NONE,
    conges:              P(true,  true,  false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      FULL,
    factures:            NONE,
  },

  // ============ Chef de Mission ============
  chef_mission: {
    clients:             NONE,
    missions:            P(true,  true,  true,  false),
    review_notes:        P(true,  true,  false, false),
    findings:            P(true,  true,  false, false),
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              P(true,  true,  true,  false),
    suivi_cac:           NONE,
    conges:              P(false, true,  false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      FULL,
    factures:            NONE,
  },

  // ============ Superviseur ============
  superviseur: {
    clients:             NONE,
    missions:            P(false, true,  true,  false),
    review_notes:        P(true,  true,  false, false),
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               P(true,  true,  true,  false),
    immobilisations:     NONE,
    caisse:              P(true,  true,  true,  false),
    suivi_cac:           NONE,
    conges:              P(true,  true,  true,  false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      FULL,
    factures:            NONE,
  },

  // ============ Senior Audit ============
  senior_audit: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Senior Expertise ============
  senior_expertise: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Junior Audit ============
  junior_audit: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Junior Expertise ============
  junior_expertise: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Stagiaires ============
  stagiaires: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Formateur Senior ============
  formateur_senior: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },

  // ============ Formateur Junior ============
  formateur_junior: {
    clients:             NONE,
    missions:            P(false, true,  false, false),
    review_notes:        NONE,
    findings:            NONE,
    besoins_cabinet:     NONE,
    stock:               NONE,
    immobilisations:     NONE,
    caisse:              NONE,
    suivi_cac:           NONE,
    conges:              P(true,  false, false, false),
    manuel:              NONE,
    notes_frais:         NONE,
    fournisseurs:        NONE,
    ressources_internes: NONE,
    collaborateurs:      P(false, true,  false, false),
    factures:            NONE,
  },
};

// ============================================================
// SUPER ADMIN — SEULE EXCEPTION
// ============================================================
export const SUPER_ADMIN_ROLE = "super_admin";

export function emptyRolePermissions(): RolePermissions {
  return Object.fromEntries(
    MODULES.map((m) => [m, { create: false, view: false, edit: false, delete: false }]),
  ) as RolePermissions;
}

export function fullRolePermissions(): RolePermissions {
  return Object.fromEntries(
    MODULES.map((m) => [m, { create: true, view: true, edit: true, delete: true }]),
  ) as RolePermissions;
}

// ============================================================
// hasPermission
// ============================================================
export interface PermissionUser {
  role?: string | null;
}

export function hasPermission(
  user: PermissionUser | null | undefined,
  module: ModuleId | string,
  action: ActionId | string,
): boolean {
  // ⛔ No user → total refusal
  if (!user) return false;

  // ✅ Super Admin → full bypass
  if (user.role === SUPER_ADMIN_ROLE) return true;

  // ⛔ role === "user" → BLOCK EVERYTHING (simple user, no permissions yet)
  if (user.role === "user") return false;

  // ⛔ No role → BLOCK EVERYTHING
  if (!user.role || user.role === "") return false;

  // ✅ Otherwise → use the matrix
  return PERMISSION_MATRIX[user.role]?.[module]?.[action as PermissionAction] === true;
}

export function getPermissionsForRole(role: string): RolePermissions {
  if (role === SUPER_ADMIN_ROLE) return fullRolePermissions();
  const perms = PERMISSION_MATRIX[role];
  return perms ? structuredClone(perms) : emptyRolePermissions();
}

export function hasAtLeastOnePermission(perms: RolePermissions | null | undefined): boolean {
  if (!perms) return false;
  return MODULES.some((m) => ACTIONS.some((a) => perms[m]?.[a] === true));
}

export function isRolePermissionsShape(value: unknown): value is RolePermissions {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return MODULES.every((m) => {
    const cell = record[m];
    if (!cell || typeof cell !== "object") return false;
    const actions = cell as Record<string, unknown>;
    return ACTIONS.every((a) => typeof actions[a] === "boolean");
  });
}

// ============================================================
// NAVIGATION MAPPING
// ============================================================
export const NAV_ITEM_MODULE: Record<string, ModuleId> = {
  "note-de-frais": "notes_frais",
  resources: "ressources_internes",
  stock: "stock",
  "fixed-assets": "immobilisations",
  manuel: "manuel",
  caisse: "caisse",
  "working-papers": "besoins_cabinet",
  fournisseurs: "fournisseurs",
  factures: "factures",
  "missions-cac": "missions",
  clients: "clients",
  engagements: "missions",
  "review-notes": "review_notes",
  findings: "findings",
  "cac-suivi": "suivi_cac",
  leave: "conges",
  collaborateurs: "collaborateurs",
};