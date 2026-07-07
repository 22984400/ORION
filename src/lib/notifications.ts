import { supabase } from "./supabase";

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  all: "Toutes",
  assignment: "Assignations",
  alert: "Alertes",
  leave: "Congés",
  document: "Documents",
  engagement: "Missions",
  client: "Clients",
  invoice: "Factures",
  stock: "Stocks",
  asset: "Immobilisations",
  team: "Équipe",
  report: "Rapports",
  review_note: "Notes de revue",
  working_paper: "Documents de travail",
  finding: "Constats",
  expense: "Notes de frais",
};

export type NotificationPayload = {
  title: string;
  message: string;
  type?: string;
  userId?: string;
};

export async function addNotification({
  title,
  message,
  type = "alert",
  userId,
}: NotificationPayload) {
  try {
    const finalUserId =
      userId || (await supabase.auth.getUser()).data.user?.id;

    if (!finalUserId) {
      return;
    }

    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type,
      user_id: finalUserId,
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Notification non enregistrée:", error.message);
    }
  } catch (err) {
    console.error("Erreur notification:", err);
  }
}
