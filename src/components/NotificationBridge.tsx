import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Global realtime notifications:
 * - Farmer: new interest_requests (INSERT where farmer_id=me) → toast + refetch
 * - Buyer: interest updated to accepted/rejected → toast + refetch
 * - Deals: new deal created involving me → toast (from auto-deal-on-accept)
 */
export function NotificationBridge() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    const ch = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interest_requests", filter: `farmer_id=eq.${user.id}` },
        (payload) => {
          const r: any = payload.new;
          toast.success(`New interest from ${r.buyer_name}`, {
            description: r.message?.slice(0, 90) ?? "Tap to review",
            action: { label: "Open", onClick: () => navigate({ to: "/interests" }) },
          });
          qc.invalidateQueries({ queryKey: ["interests"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interest_requests", filter: `buyer_id=eq.${user.id}` },
        (payload) => {
          const r: any = payload.new;
          const prev: any = payload.old;
          if (r.status === prev.status) return;
          if (r.status === "accepted") {
            toast.success("Farmer accepted your interest 🎉", {
              description: r.farmer_response ?? "A deal has been created.",
              action: { label: "See deal", onClick: () => navigate({ to: "/deals" }) },
            });
          } else if (r.status === "rejected") {
            toast.info("Farmer declined your interest", {
              description: r.farmer_response ?? "You can try another listing.",
            });
          }
          qc.invalidateQueries({ queryKey: ["interests"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals", filter: `buyer_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["deals"] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals", filter: `farmer_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["deals"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc, navigate]);

  return null;
}
