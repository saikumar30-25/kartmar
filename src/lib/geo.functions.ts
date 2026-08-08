import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const schema = z.object({ address: z.string().trim().min(2).max(200) });

/** Geocode a free-text Indian address/district to lat+lng via the Google Maps gateway. */
export const geocodeAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) return { lat: null, lng: null, formatted: null };

    const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(
      `${data.address}, India`,
    )}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Geocoding failed [${res.status}]: ${body}`);
    }
    const json: any = await res.json();
    const first = json?.results?.[0];
    if (!first?.geometry?.location) return { lat: null, lng: null, formatted: null };
    return {
      lat: Number(first.geometry.location.lat),
      lng: Number(first.geometry.location.lng),
      formatted: String(first.formatted_address ?? ""),
    };
  });
