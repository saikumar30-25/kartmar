import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({ interest_id: z.string().uuid() });

/**
 * Returns the seller's name + phone so the buyer's booking notification can be
 * delivered on WhatsApp. Only the buyer who created that interest request (or
 * the seller themselves) can read it, and only for their own interest row.
 */
export const getSellerNotifyContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: interest, error } = await context.supabase
      .from("interest_requests")
      .select("id, buyer_id, farmer_id, listing_id")
      .eq("id", data.interest_id)
      .maybeSingle();
    if (error) throw error;
    if (!interest) throw new Error("Interest request not found");
    if (interest.buyer_id !== context.userId && interest.farmer_id !== context.userId)
      throw new Error("Not allowed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: seller } = await supabaseAdmin
      .from("profiles")
      .select("name, phone")
      .eq("id", interest.farmer_id)
      .maybeSingle();

    return {
      name: seller?.name ?? "farmer",
      phone: seller?.phone ?? null,
    };
  });
