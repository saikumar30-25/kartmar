import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DealLocation = {
  deal_id: string;
  user_id: string;
  role: string;
  lat: number;
  lng: number;
  updated_at: string;
};

/**
 * Broadcast this device's GPS position into deal_locations for a deal, and keep it fresh.
 * Every participant (farmer, buyer, delivery partner) can then see each other live.
 */
export function useShareMyLocation(
  dealId: string | undefined,
  userId: string | undefined,
  role: string | undefined,
  enabled = true,
) {
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!enabled || !dealId || !userId || !role) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location not supported on this device");
      return;
    }

    let stopped = false;
    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (stopped) return;
        setSharing(true);
        setError(null);
        const now = Date.now();
        if (now - lastSent < 8000) return; // throttle writes
        lastSent = now;
        await supabase.from("deal_locations").upsert(
          {
            deal_id: dealId,
            user_id: userId,
            role,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "deal_id,user_id" },
        );
      },
      (err) => {
        setSharing(false);
        setError(err.message || "Could not read your location");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [dealId, userId, role, enabled]);

  return { sharing, error };
}

/** Live positions of everyone on a deal (realtime). */
export function useDealLocations(dealId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["deal_locations", dealId],
    queryFn: async () => {
      if (!dealId) return [] as DealLocation[];
      const { data, error } = await supabase
        .from("deal_locations")
        .select("deal_id,user_id,role,lat,lng,updated_at")
        .eq("deal_id", dealId);
      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) })) as DealLocation[];
    },
    enabled: !!dealId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!dealId) return;
    const ch = supabase
      .channel(`deal_loc:${dealId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deal_locations", filter: `deal_id=eq.${dealId}` },
        () => qc.invalidateQueries({ queryKey: ["deal_locations", dealId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [dealId, qc]);

  return q;
}
