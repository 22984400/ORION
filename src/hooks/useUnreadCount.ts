import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setCount(0);
        setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
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
    fetchCount();

    // 🔔 Écouter les changements en temps réel
    const channel = supabase
      .channel("notifications_count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async () => {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) return;
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userData.user.id)
            .eq("read", false);
          setCount(count || 0);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: "read=eq.false",
        },
        async () => {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) return;
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userData.user.id)
            .eq("read", false);
          setCount(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
}