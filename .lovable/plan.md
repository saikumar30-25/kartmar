
# AgriConnect — Real Backend Phase

This converts the prototype into a real full-stack app. Three workstreams land in one pass, sharing one Supabase schema.

## 1. Enable Lovable Cloud + connect Twilio

- Enable Lovable Cloud (provisions Supabase: Postgres, Auth, Storage, Realtime, server functions). Lovable Cloud already issues JWTs on every successful auth — no custom JWT layer needed; we just verify via `requireSupabaseAuth` on server functions.
- Link the **Twilio** connector for OTP SMS (MSG91 is not an available connector; using Twilio Verify keeps it one click and works for Indian numbers). If you'd rather use MSG91, say so and I'll swap in a custom HTTP integration with an API key you paste in.

## 2. Database schema (migration)

Tables in `public` (all with explicit GRANTs + RLS):

```text
profiles            id (=auth.uid), full_name, phone, role default, language, village, district, state, kyc_status, avatar_url
user_roles          user_id, role enum(farmer|buyer|driver|admin)   -- roles never on profiles
listings            id, farmer_id, crop, variety, qty_kg, price_paise, tier, photos[], freshness, location, status, created_at
requirements        id, buyer_id, crop, qty_kg, max_price_paise, deliver_by, location, status
deals               id, listing_id, buyer_id, farmer_id, agreed_price_paise, qty_kg, status enum, escrow_status, created_at
deal_events         id, deal_id, type, payload jsonb, created_at      -- audit/timeline
chats               id, deal_id (nullable), listing_id (nullable), kind enum(bargain|support)
chat_messages       id, chat_id, sender_id, role enum(user|ai|system), body, created_at
bookings            id, deal_id, pickup, dropoff, distance_km, fare_paise, status enum, driver_id nullable
trips               id, booking_id, driver_id, status enum(assigned|enroute_pickup|picked|enroute_drop|delivered), eta, last_lat, last_lng, updated_at
driver_profiles     user_id, vehicle, plate, license_url, rc_url, aadhaar_url, verified_at
disputes            id, deal_id, raised_by, reason, status, resolution
otp_log             phone, attempts, last_sent_at                     -- rate limit support
```

Plus an `app_role` enum and a `has_role(uid, role)` security-definer function; RLS uses it for admin policies. Storage buckets: `listing-photos` (public read), `kyc-docs` (private).

## 3. Phone OTP auth (Twilio Verify) + JWT session

Flow:
1. `requestOtp({ phone })` server fn → calls Twilio Verify `/Services/{sid}/Verifications` via gateway, rate-limited by `otp_log`.
2. `verifyOtp({ phone, code })` server fn → Twilio `/VerificationCheck`. On `approved`, use `supabaseAdmin.auth.admin.generateLink` / `signInWithOtp`-style flow to create or fetch the user by phone and mint a Supabase session (JWT access + refresh). Returns session to client, which calls `supabase.auth.setSession()` — that's the JWT.
3. New signup flow asks for role + name after first verification → inserts `profiles` row and a `user_roles` row.
4. Twilio Verify Service SID stored as `TWILIO_VERIFY_SERVICE_SID` (set via `set_secret` after you provide it, or I add a small admin page to configure it).

Routes:
- `/login` → phone input → OTP input. Keep an "email/password (dev)" toggle for testing.
- `/signup` → same OTP, then role + profile step.
- `/auth/callback` not needed (no OAuth this turn).
- All app routes move under `src/routes/_authenticated/*`; layout uses the integration-managed gate.

## 4. Replace mock data with Supabase queries

- Delete `src/lib/mock-data.ts` reads; keep it only as a seed migration that inserts demo rows for the current user on first sign-in (optional toggle).
- `src/lib/auth.tsx` → wraps `supabase.auth`, exposes `useAuth()` with user + role (read once from `user_roles`).
- New `*.functions.ts` modules (client-safe, server-fn only):
  - `listings.functions.ts` — list/filter/get/create/update/delete
  - `requirements.functions.ts`
  - `deals.functions.ts` — create deal from bargain accept, pay (mark escrow), complete, dispute
  - `chats.functions.ts` — fetch + post message; AI bargain reply uses Lovable AI Gateway (`google/gemini-2.5-flash`) with the farmer's hidden floor price as system prompt
  - `bookings.functions.ts` — request driver, accept, update trip
  - `profile.functions.ts`, `admin.functions.ts`
- Public listing browse uses a server publishable client with narrow `TO anon SELECT` policy on `listings` (status='active') so the landing page renders without login.
- Loader pattern: `context.queryClient.ensureQueryData(...)` + `useSuspenseQuery` in components. Every route gets `errorComponent` + `notFoundComponent`.
- Listing photos uploaded to `listing-photos` bucket via `supabase.storage` from the post-listing form.

## 5. Realtime delivery booking + trip status

- When a buyer pays a deal, server fn inserts a `bookings` row (status `pending`) near the pickup location.
- Driver dashboard (`/_authenticated/partner`) subscribes:
  ```ts
  supabase.channel('bookings:pending')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: 'status=eq.pending' }, ...)
  ```
  → shows an incoming-booking modal in real time (replacing the current simulated timeout).
- Driver `accept` → server fn updates `bookings.status='assigned'`, `driver_id=auth.uid()`, inserts a `trips` row. A Postgres trigger fires `pg_notify` and Realtime broadcasts.
- Buyer + farmer deal page (`/_authenticated/deals/$id`) subscribes to `trips:booking_id=eq.<id>` for live status + ETA updates; map marker re-renders on each `UPDATE`.
- Driver "Start trip / Picked up / Delivered" buttons call `updateTripStatus` server fn; each transition writes a `deal_events` audit row.
- Realtime is enabled per table via `alter publication supabase_realtime add table bookings, trips, chat_messages;` in the migration.

## 6. AI bargaining (real, not scripted)

`bargainReply` server fn calls Lovable AI Gateway:
- System prompt includes listing crop, ask price, hidden floor price, buyer's offer history.
- Model: `google/gemini-2.5-flash` (free during promo).
- Function-call style output: `{ counter_paise, message, accept: boolean }`. On `accept=true`, the fn creates a `deals` row atomically.

## 7. Security checklist

- RLS on every table; policies scoped to `auth.uid()` (farmer owns listing, buyer owns requirement, parties on deal can read it, driver sees only bookings assigned to them or pending in their area).
- Admin policies use `has_role(auth.uid(),'admin')`.
- `service_role` only used inside `*.server.ts` helpers loaded with dynamic `await import()` inside handlers.
- OTP rate-limit: max 5/hour/phone, 60s cooldown between sends.
- KYC docs in private bucket, signed URLs only.

## Secrets I'll request after you approve

- Twilio connector (one click via connector picker) → provides `TWILIO_API_KEY` automatically.
- `TWILIO_VERIFY_SERVICE_SID` — you create a Verify Service in Twilio console (free) and paste the SID; I'll request it via secure form.
- `LOVABLE_API_KEY` is auto-provisioned for AI Gateway.

## Out of scope this pass

- Real UPI/Razorpay (escrow stays mocked with status flags; ready to wire next).
- Google Maps tiles (mock map; switch to Mapbox/Google after you pick a provider).
- Push notifications to driver phones (Realtime covers in-app; FCM is a separate phase).

## Order of execution

1. Enable Lovable Cloud, link Twilio, request `TWILIO_VERIFY_SERVICE_SID`.
2. Run schema migration (tables, enums, RLS, grants, realtime publication, seed admin user).
3. Build OTP auth pages + `_authenticated/` move.
4. Port listings → requirements → deals → chats to Supabase (parallel file writes).
5. Realtime bookings + trips, driver dashboard rewrite.
6. AI bargain server fn + advisor server fn.
7. Smoke test: signup as farmer, post listing; signup as buyer (different browser), bargain, pay; signup as driver, accept booking, drive through statuses; verify all three see updates live.
