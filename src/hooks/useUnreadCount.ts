// src/hooks/useUnreadCount.ts

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const subscribedRef = useRef<boolean>(false);

  const fetchCount = async (userId?: string) => {
    try {
      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
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

  const setupRealtime = async (userId: string) => {
    // Nettoyer l'ancien channel si l'utilisateur change
    if (userIdRef.current && userIdRef.current !== userId) {
      if (channelRef.current) {
        try {
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (e) {}
        channelRef.current = null;
        subscribedRef.current = false;
      }
    }

    userIdRef.current = userId;

    // Si un channel existe déjà et est souscrit, on ne refait rien
    if (channelRef.current && subscribedRef.current) {
      return;
    }

    // Créer un nouveau channel et attacher les listeners AVANT subscribe()
    const channel = supabase
      .channel(`notifications_count_${userId}`)
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
        }
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
        }
      );

    channelRef.current = channel;
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        subscribedRef.current = true;
        console.log(`Realtime activé pour l'utilisateur ${userId}`);
      }
    });
  };

  useEffect(() => {
    let authSub: any;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (userId) {
        await fetchCount(userId);
        await setupRealtime(userId);
      } else {
        setCount(0);
        setLoading(false);
      }
    };
    init();

    authSub = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id;
      if (userId) {
        await fetchCount(userId);
        await setupRealtime(userId);
      } else {
        // Déconnexion : nettoyer
        if (channelRef.current) {
          try {
            await channelRef.current.unsubscribe();
            supabase.removeChannel(channelRef.current);
          } catch (e) {}
          channelRef.current = null;
          subscribedRef.current = false;
          userIdRef.current = null;
        }
        setCount(0);
        setLoading(false);
      }
    });

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (e) {}
        channelRef.current = null;
        subscribedRef.current = false;
        userIdRef.current = null;
      }
      try {
        authSub?.subscription?.unsubscribe?.();
        if (authSub?.data?.subscription) authSub.data.subscription.unsubscribe();
      } catch (e) {}
    };
  }, []);

  return { count, loading, refetch: fetchCount };
}