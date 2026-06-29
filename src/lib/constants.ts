// src/lib/constants.ts

import {
  LayoutDashboard,
  Building2,
  Target,
  ClipboardCheck,
  Search,
  FileText,
  Package,
  Landmark,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  BookOpen,       // ✅ NOUVEAU pour l'icône du manuel
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard', path: '/' },
    ],
  },
  {
    section: 'Audit',
    items: [
      { id: 'clients', label: 'Clients', icon: 'Building2', path: '/clients' },
      { id: 'engagements', label: 'Missions', icon: 'Target', path: '/engagements' },
      { id: 'review-notes', label: 'Notes de revue', icon: 'ClipboardCheck', path: '/review-notes' },
      { id: 'findings', label: 'Constats', icon: 'Search', path: '/findings' },
      { id: 'working-papers', label: 'Documents de travail', icon: 'FileText', path: '/working-papers' },
    ],
  },
  {
    section: 'Opérations',
    items: [
      { id: 'stock', label: 'Stock', icon: 'Package', path: '/stock' },
      { id: 'fixed-assets', label: 'Immobilisations', icon: 'Landmark', path: '/fixed-assets' },
      { id: 'leave', label: 'Congés', icon: 'CalendarDays', path: '/leave' },
      { id: 'manuel', label: 'Manuel', icon: 'BookOpen', path: '/manuel' }, // ✅ icône changée
    ],
  },
  {
    section: 'Administration',
    items: [
      { id: 'team', label: 'Équipe', icon: 'Users', path: '/team' },
      { id: 'reports', label: 'Rapports', icon: 'BarChart3', path: '/reports' },
      { id: 'notifications', label: 'Notifications', icon: 'Bell', path: '/notifications' },
    ],
  },
] as const;

// Le reste du fichier (QUICK_ACTIONS, status configs, etc.) reste inchangé.
// Je le recopie tel quel pour être complet :

export const QUICK_ACTIONS = [
  { id: 'new-engagement', label: 'Nouvelle mission', icon: 'Target', color: 'primary' as const },
  { id: 'new-finding', label: 'Signaler un constat', icon: 'Search', color: 'warning' as const },
  { id: 'stock-in', label: 'Entrée de stock', icon: 'PackagePlus', color: 'emerald' as const },
  { id: 'request-leave', label: 'Demander un congé', icon: 'CalendarDays', color: 'cyan' as const },
  { id: 'upload-paper', label: 'Téléverser document', icon: 'Upload', color: 'royal' as const },
] as const;

export const ENGAGEMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-slate-500/15 text-slate-300 ring-slate-500/25' },
  planning: { label: 'Planification', color: 'bg-info-500/15 text-info-500 ring-info-500/25' },
  in_progress: { label: 'En cours', color: 'bg-warning-500/15 text-warning-500 ring-warning-500/25' },
  review: { label: 'Revue', color: 'bg-primary-500/15 text-primary-300 ring-primary-500/25' },
  completed: { label: 'Terminé', color: 'bg-success-500/15 text-success-500 ring-success-500/25' },
  closed: { label: 'Fermé', color: 'bg-slate-500/15 text-slate-300 ring-slate-500/25' },
};

export const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Faible', color: 'bg-slate-500/15 text-slate-300 ring-slate-500/25' },
  medium: { label: 'Moyen', color: 'bg-info-500/15 text-info-500 ring-info-500/25' },
  high: { label: 'Élevé', color: 'bg-warning-500/15 text-warning-500 ring-warning-500/25' },
  critical: { label: 'Critique', color: 'bg-error-500/15 text-error-500 ring-error-500/25' },
};

export const MISSION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Ouvert', color: 'bg-info-500/15 text-info-500 ring-info-500/25' },
  closed: { label: 'Fermé', color: 'bg-success-500/15 text-success-500 ring-success-500/25' },
  postponed: { label: 'Reporté', color: 'bg-warning-500/15 text-warning-500 ring-warning-500/25' },
};

export const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  significant: 'Significatif',
  minor: 'Mineur',
};

export const RISK_LABELS: Record<string, string> = {
  critical: 'Critique',
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Congé annuel',
  sick: 'Maladie',
  maternity: 'Maternité',
  personal: 'Personnel',
  unpaid: 'Sans solde',
};

export const USER_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  partner: 'Associé',
  manager: 'Manager',
  senior_auditor: 'Auditeur Senior',
  auditor: 'Auditeur',
  hr_officer: 'Responsable RH',
  stock_manager: 'Gestionnaire Stock',
  asset_manager: 'Gestionnaire Actifs',
  finance_officer: 'Responsable Finance',
  read_only: 'Lecture seule',
};

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  buildings: 'Bâtiments',
  equipment: 'Équipements',
  vehicles: 'Véhicules',
  furniture: 'Mobilier',
  it_equipment: 'Équipement IT',
  other: 'Autres',
};

export const STOCK_CATEGORY_LABELS: Record<string, string> = {
  supplies: 'Fournitures',
  equipment: 'Équipements',
  materials: 'Matériaux',
  services: 'Services',
  other: 'Autres',
};