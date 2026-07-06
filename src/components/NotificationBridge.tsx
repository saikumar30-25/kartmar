import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRespondInterest } from "@/lib/queries";
import { logEvent, openWhatsAppWithLog } from "@/lib/notification-log";
import { waLink } from "@/lib/whatsapp";

/**
 * Global realtime notifications + event log.
 * - Farmer: new interest_requests → toast with Accept / Reject action buttons.
 * - Buyer:  interest updated to accepted/rejected → toast + auto-open WA.
 * - Trips:  driver claims trip → toast to participants.
 * Every event is appended to the per-user notification log (localStorage).
 */
export function NotificationBridge() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const respond = useRespondInterest();

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    const handleAcceptReject = async (r: any, status: "accepted" | "rejected") => {
      try {
        await respond.mutateAsync({ id: r.id, status });
        toast.success(status === "accepted" ? "Order accepted" : "Order declined");
        logEvent(uid, {
          kind: status === "accepted" ? "interest_accepted" : "interest_rejected",
          title: status === "accepted" ? `Accepted order from ${r.buyer_name}` : `Declined order from ${r.buyer_name}`,
          description: r.listing_product_name ?? "",
          status: "sent",
          meta: { interest_id: r.id, buyer: r.buyer_name },
        });
        // Auto-open branded WhatsApp to buyer if phone available.
        const { data: contact } = await supabase
          .from("interest_request_contacts")
          .select("buyer_phone").eq("interest_id", r.id).maybeSingle();
        const productName = r.listing_product_name ?? "your order";
        // Fetch listing + farmer profile for a full deal receipt.
        const { data: listing } = await supabase
          .from("listings").select("product_name,unit,price_paise,district,state,farmer_id").eq("id", r.listing_id).maybeSingle();
        const { data: farmerProfile } = await supabase
          .from("profiles").select("name,phone,address,pincode,district,state").eq("id", uid).maybeSingle();

        const qtyText = r.quantity ? `${r.quantity} ${listing?.unit ?? ""}` : "";
        const priceText = r.offer_price_paise
          ? `₹${Math.round(r.offer_price_paise / 100)}/${listing?.unit ?? "unit"}`
          : listing?.price_paise ? `₹${Math.round(listing.price_paise / 100)}/${listing.unit ?? "unit"}` : "";
        const totalText = r.quantity && (r.offer_price_paise || listing?.price_paise)
          ? `Total ≈ ₹${Math.round((r.quantity * (r.offer_price_paise ?? listing!.price_paise)) / 100)}`
          : "";

        const receipt = status === "accepted"
          ? [
              `🌾 *Kartmar — Order accepted*`,
              ``,
              `Hi ${r.buyer_name}, your order has been accepted!`,
              ``,
              `• Product: ${productName}`,
              qtyText && `• Quantity: ${qtyText}`,
              priceText && `• Price: ${priceText}`,
              totalText && `• ${totalText}`,
              ``,
              `*Seller contact*`,
              `• Name: ${farmerProfile?.name ?? "Farmer"}`,
              farmerProfile?.phone && `• Phone: ${farmerProfile.phone}`,
              (farmerProfile?.address || farmerProfile?.pincode) && `• Address: ${farmerProfile?.address ?? ""}${farmerProfile?.pincode ? " — " + farmerProfile.pincode : ""}`,
              `• Location: ${farmerProfile?.district ?? listing?.district ?? ""}, ${farmerProfile?.state ?? listing?.state ?? ""}`,
              ``,
              `Open Kartmar to complete secure payment.`,
            ].filter(Boolean).join("\n")
          : `Hi ${r.buyer_name}, unfortunately your order for ${productName} on Kartmar has been declined. You can browse other listings anytime.`;

        openWhatsAppWithLog(uid, waLink(contact?.buyer_phone, receipt), {
          to: r.buyer_name,
          phone: contact?.buyer_phone ?? null,
          context: status === "accepted" ? "Interest accepted → buyer (with receipt)" : "Interest declined → buyer",
          message: receipt,
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Failed");
        logEvent(uid, {
          kind: status === "accepted" ? "interest_accepted" : "interest_rejected",
          title: `Failed to ${status === "accepted" ? "accept" : "decline"} order`,
          description: e?.message ?? "Unknown error",
          status: "failed",
          meta: { interest_id: r.id },
        });
      }
    };

    const ch = supabase
      .channel(`notif:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interest_requests", filter: `farmer_id=eq.${uid}` },
        (payload) => {
          const r: any = payload.new;
          logEvent(uid, {
            kind: "interest_received",
            title: `New booking from ${r.buyer_name}`,
            description: r.message?.slice(0, 120) ?? "Tap to review",
            status: "info",
            meta: { interest_id: r.id, listing_id: r.listing_id, quantity: r.quantity },
          });
          toast(`New booking from ${r.buyer_name}`, {
            description: r.message?.slice(0, 120) ?? "Someone booked your product. Accept or reject to proceed.",
            duration: 15000,
            action: { label: "Accept", onClick: () => handleAcceptReject(r, "accepted") },
            cancel: { label: "Reject", onClick: () => handleAcceptReject(r, "rejected") },
          });
          qc.invalidateQueries({ queryKey: ["interests"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interest_requests", filter: `buyer_id=eq.${uid}` },
        (payload) => {
          const r: any = payload.new;
          const prev: any = payload.old;
          if (r.status === prev.status) return;
          if (r.status === "accepted") {
            toast.success("Farmer accepted your interest 🎉", {
              description: r.farmer_response ?? "A deal has been created. Contact details are now revealed.",
              duration: 12000,
              action: { label: "See deal", onClick: () => navigate({ to: "/deals" }) },
            });
            logEvent(uid, {
              kind: "interest_accepted",
              title: "Your booking was accepted",
              description: r.farmer_response ?? "Contact details revealed.",
              status: "sent",
              meta: { interest_id: r.id },
            });
          } else if (r.status === "rejected") {
            toast.info("Farmer declined your interest", {
              description: r.farmer_response ?? "You can try another listing.",
              action: { label: "Browse", onClick: () => navigate({ to: "/browse" }) },
            });
            logEvent(uid, {
              kind: "interest_rejected",
              title: "Your booking was declined",
              description: r.farmer_response ?? "",
              status: "info",
              meta: { interest_id: r.id },
            });
          }
          qc.invalidateQueries({ queryKey: ["interests"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals", filter: `buyer_id=eq.${uid}` },
        (payload) => {
          const d: any = payload.new;
          logEvent(uid, {
            kind: "deal_created",
            title: "Deal created",
            description: `${d.product_name} · ${d.quantity} ${d.unit}`,
            status: "info",
            meta: { deal_id: d.id },
          });
          qc.invalidateQueries({ queryKey: ["deals"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals", filter: `farmer_id=eq.${uid}` },
        () => qc.invalidateQueries({ queryKey: ["deals"] }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips" },
        (payload) => {
          const t: any = payload.new;
          const prev: any = payload.old;
          if (t.partner_id && !prev.partner_id) {
            toast.success("🚚 Delivery partner accepted your trip", {
              description: `${t.pickup_district} → ${t.drop_district}`,
              action: { label: "Open", onClick: () => navigate({ to: "/deals" }) },
            });
            logEvent(uid, {
              kind: "trip_partner_accepted",
              title: "Driver accepted your trip",
              description: `${t.pickup_district} → ${t.drop_district}`,
              status: "sent",
              meta: { trip_id: t.id, deal_id: t.deal_id },
            });
            qc.invalidateQueries({ queryKey: ["trip_for_deal"] });
            qc.invalidateQueries({ queryKey: ["deals"] });
          } else if (t.status !== prev.status) {
            qc.invalidateQueries({ queryKey: ["trip_for_deal"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc, navigate, respond]);

  return null;
}
