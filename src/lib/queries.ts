import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { Database } from "@/integrations/supabase/types";

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type RequirementRow = Database["public"]["Tables"]["requirements"]["Row"];
export type RequirementInsert = Database["public"]["Tables"]["requirements"]["Insert"];
export type DealRow = Database["public"]["Tables"]["deals"]["Row"];
export type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
export type DealMessageRow = Database["public"]["Tables"]["deal_messages"]["Row"];
export type TripRow = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type PartnerProfileRow = Database["public"]["Tables"]["partner_profiles"]["Row"];
export type PartnerProfileInsert = Database["public"]["Tables"]["partner_profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// ---------- Profile editing ----------
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProfileUpdate }) => {
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner_profile"] });
    },
  });
}

// ---------- Admin: partner verification ----------
export function useAllPartners() {
  return useQuery({
    queryKey: ["admin_partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const ids = data.map((p) => p.id);
      const { data: profs } = await supabase.from("profiles").select("id,name,phone,district,state").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return data.map((p) => ({ ...p, profile: map.get(p.id) ?? null }));
    },
  });
}

export function useReviewPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase
        .from("partner_profiles")
        .update({
          verification_status: status,
          rejection_reason: reason ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_partners"] });
      qc.invalidateQueries({ queryKey: ["partner_profile"] });
    },
  });
}

// ---------- Auth gate ----------
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!user.role) navigate({ to: "/select-role" });
    else if (!user.details_completed) navigate({ to: "/onboarding" });
  }, [loading, user, navigate]);

  return { user, loading };
}

// ---------- Listings ----------
export function useListings() {
  return useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: farmer } = await supabase
        .from("profiles")
        .select("id,name,district,state,rating,phone,is_verified")
        .eq("id", data.farmer_id)
        .maybeSingle();
      return { ...data, farmer };
    },
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ListingInsert) => {
      const { data, error } = await supabase.from("listings").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });
}

// ---------- Requirements ----------
export function useRequirements() {
  return useQuery({
    queryKey: ["requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRequirement(id: string) {
  return useQuery({
    queryKey: ["requirement", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("requirements").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: buyer } = await supabase
        .from("profiles")
        .select("id,name,district,state,rating,phone")
        .eq("id", data.buyer_id)
        .maybeSingle();
      return { ...data, buyer };
    },
  });
}

export function useCreateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequirementInsert) => {
      const { data, error } = await supabase.from("requirements").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requirements"] }),
  });
}

// ---------- Deals ----------
export function useMyDeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .or(`farmer_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: farmer }, { data: buyer }] = await Promise.all([
        supabase.from("profiles").select("id,name,phone,district,state,rating").eq("id", data.farmer_id).maybeSingle(),
        supabase.from("profiles").select("id,name,phone,district,state,rating").eq("id", data.buyer_id).maybeSingle(),
      ]);
      return { ...data, farmer, buyer };
    },
  });
}


export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DealInsert) => {
      const { data, error } = await supabase.from("deals").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useUpdateDealStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DealRow["status"] }) => {
      const { data, error } = await supabase.from("deals").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["deal", v.id] });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// Realtime subscribe to a single deal for live status
export function useDealRealtime(dealId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!dealId) return;
    const ch = supabase
      .channel(`deal:${dealId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals", filter: `id=eq.${dealId}` }, () => {
        qc.invalidateQueries({ queryKey: ["deal", dealId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [dealId, qc]);
}

// ---------- Deal Messages (bargain chat) ----------
export function useDealMessages(dealId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["deal_messages", dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from("deal_messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!dealId,
  });

  useEffect(() => {
    if (!dealId) return;
    const ch = supabase
      .channel(`deal_msgs:${dealId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${dealId}` },
        () => qc.invalidateQueries({ queryKey: ["deal_messages", dealId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [dealId, qc]);

  return q;
}

export function useSendDealMessage() {
  return useMutation({
    mutationFn: async (input: {
      deal_id: string;
      sender_id: string;
      sender_role: string;
      message: string;
      offer_price_paise?: number | null;
    }) => {
      const { data, error } = await supabase.from("deal_messages").insert(input).select().single();
      if (error) throw error;
      return data;
    },
  });
}

// ---------- Partner profile ----------
export function useMyPartnerProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["partner_profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRegisterPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartnerProfileInsert) => {
      const { data, error } = await supabase
        .from("partner_profiles")
        .upsert(input, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner_profile"] }),
  });
}

export function useTogglePartnerOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_online }: { id: string; is_online: boolean }) => {
      const { error } = await supabase.from("partner_profiles").update({ is_online }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner_profile"] }),
  });
}

// ---------- Trips (delivery) ----------
// Open trip offers visible to logged-in partners + their own assigned trips. Realtime.
export function usePartnerTrips() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["partner_trips", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trips")
        .select("*, deal:deals(product_name, quantity, unit, photo_url)")
        .or(`partner_id.eq.${user.id},and(partner_id.is.null,status.eq.offered)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`trips:partner:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () =>
        qc.invalidateQueries({ queryKey: ["partner_trips", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  return q;
}

export function useTripForDeal(dealId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["trip_for_deal", dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      let partner = null;
      if (data.partner_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,name,phone")
          .eq("id", data.partner_id)
          .maybeSingle();
        partner = p;
      }
      return { ...data, partner };
    },

    enabled: !!dealId,
  });

  useEffect(() => {
    if (!dealId) return;
    const ch = supabase
      .channel(`trip_deal:${dealId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `deal_id=eq.${dealId}` },
        () => qc.invalidateQueries({ queryKey: ["trip_for_deal", dealId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [dealId, qc]);

  return q;
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TripInsert) => {
      const { data, error } = await supabase.from("trips").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["trip_for_deal", v.deal_id] });
      qc.invalidateQueries({ queryKey: ["partner_trips"] });
    },
  });
}

export function useAcceptTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, partner_id }: { id: string; partner_id: string }) => {
      const { data, error } = await supabase
        .from("trips")
        .update({ partner_id, status: "accepted" })
        .eq("id", id)
        .is("partner_id", null)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner_trips"] });
      qc.invalidateQueries({ queryKey: ["trip_for_deal"] });
    },
  });
}

export function useUpdateTripStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TripRow["status"] }) => {
      const patch: Partial<TripRow> = { status };
      if (status === "picked_up") patch.pickup_at = new Date().toISOString();
      if (status === "delivered") patch.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("trips").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner_trips"] });
      qc.invalidateQueries({ queryKey: ["trip_for_deal"] });
    },
  });
}
