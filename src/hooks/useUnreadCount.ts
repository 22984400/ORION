import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async (userId?: string) => {
    try {
      const currentUserId =
        userId || (await supabase.auth.getUser()).data.user?.id;
      if (!currentUserId) {
        setCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUserId)
        .eq("read", false);

      if (error) throw error;
      setCount(count || 0);
    } catch (err) {
      console.error("Erreur comptage notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setCount(0);
        setLoading(false);
        return;
      }

      await fetchCount(userId);

      channel = supabase
        .channel("notifications_count")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            await fetchCount(userId);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            await fetchCount(userId);
          },
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
}