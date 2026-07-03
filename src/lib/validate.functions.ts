import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  role: z.enum(["farmer", "owner", "partner"]),
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  vehicle_type: z.string().optional().nullable(),
  vehicle_number: z.string().optional().nullable(),
  capacity_kg: z.union([z.string(), z.number()]).optional().nullable(),
  aadhaar_last4: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
});

export type ValidationIssue = { field: string; message: string };
export type ValidationResult = { ok: boolean; issues: ValidationIssue[]; summary: string };

export const validateOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ValidationResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: true, issues: [], summary: "AI validation unavailable — skipped." };

    const systemPrompt = `You are a strict but fair identity/details validator for AgriConnect (India).
Given user-submitted profile details, detect obviously fake, placeholder, gibberish, or nonsensical values.
Return JSON only with shape: {"ok": boolean, "issues": [{"field": string, "message": string}], "summary": string}.

Rules:
- name: real Indian human name; reject gibberish like "asdfgh", "test test", "aaaa", single letters, or offensive words.
- address: must look like a real street/village address (contains a locality, area, or landmark). Reject "abc", "xxx", "test", "n/a", random keyboard mashes.
- district & state: must be an actual Indian district/state. Reject fictional or misspelled beyond recognition.
- pincode: must be a plausible Indian 6-digit PIN whose first digit matches the state region (e.g. Telangana=5, Karnataka=5, Maharashtra=4, TN=6, Delhi=1). Flag mismatches.
- phone: 10-digit Indian mobile starting 6-9. Reject repeated digits (9999999999, 1234567890 pattern).
- For role="partner":
  - vehicle_number: must match Indian format like "TS09AB1234" / "MH12CD3456" (2 state letters + 1-2 digits + 1-3 letters + 1-4 digits). Reject "ABC123", "XX00XX0000", repeated chars.
  - capacity_kg vs vehicle_type: bike ≤ 30, tempo ≤ 300, pickup ≤ 1000, mini_truck ≤ 3000, tractor > 3000.
  - aadhaar_last4: reject "0000","1234","1111" etc.
  - license_number (if provided): Indian DL format "SS-RR-YYYY-NNNNNNN" or similar 13-16 alnum. Reject "12345", "abcdef".
- Cross-check: state should be consistent with vehicle_number state code if provided.
Only flag CLEARLY invalid ones. If everything is plausible, ok=true issues=[].
Keep summary under 140 chars.`;

    const userPrompt = `Validate these onboarding details:\n${JSON.stringify(data, null, 2)}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("AI validation gateway error", res.status, text);
        if (res.status === 402) return { ok: true, issues: [], summary: "AI credits exhausted — skipped validation." };
        if (res.status === 429) return { ok: true, issues: [], summary: "AI rate limit — skipped validation." };
        return { ok: true, issues: [], summary: "AI validation unavailable — skipped." };
      }

      const payload = await res.json();
      const content = payload?.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const issues: ValidationIssue[] = Array.isArray(parsed.issues) ? parsed.issues : [];
      const ok = issues.length === 0 && parsed.ok !== false;
      return {
        ok,
        issues,
        summary: typeof parsed.summary === "string" ? parsed.summary : ok ? "Details look valid." : "Some details need attention.",
      };
    } catch (e: any) {
      console.error("AI validation exception", e);
      return { ok: true, issues: [], summary: "AI validation failed — skipped." };
    }
  });
