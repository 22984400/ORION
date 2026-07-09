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
    let authSub: any;

    const setupForUser = async (userId?: string) => {
      if (!userId) {
        setCount(0);
        setLoading(false);
        return;
      }

      await fetchCount(userId);

      // remove previous channel if any
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      }

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

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      await setupForUser(userId);
    };

    init();

    // Re-run setup whenever auth state changes so we don't miss the user
    authSub = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id;
      await setupForUser(uid);
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      try {
        authSub?.subscription?.unsubscribe?.();
        // older supabase versions return { data: { subscription } }
        if (authSub?.data?.subscription) authSub.data.subscription.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return { count, loading, refetch: fetchCount };
}