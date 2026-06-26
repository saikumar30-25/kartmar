# AgriConnect — Clickable UI Prototype

A complete front-end prototype of the AgriConnect marketplace with mock data and no real backend. Every screen from the spec is navigable so you can click through and feel the full product. Backend (Lovable Cloud, payments, Twilio OTP, Claude, Razorpay, Google Maps) is deferred to a later phase.

## Design direction

Going with **Organic earthy modernist** — closest match to the spec's brand (earthy green #1b4332, clay #e2725b, cream #fdfcf8), uses Plus Jakarta Sans + Noto Sans Devanagari/Telugu for multilingual support, mobile-first card-based layout. Tokens go into `src/styles.css` as semantic design tokens.

## Auth (mock)

- Email/password signup + login pages (no real validation — accepts anything, stores fake user in localStorage)
- Role selection screen after signup: Farmer / Market Owner / Delivery Partner
- Phone OTP UI stub on login page marked "Coming soon"
- A role switcher in the top nav for demoing all four perspectives without re-logging in

## Screens to build (all with mock data)

**Shared**
- Landing/marketing page (logged-out home)
- Login, Signup, Role selection
- Top nav (logo, role switcher, notifications bell with mock dropdown, profile)
- Mobile sticky bottom tab bar

**Farmer**
- Dashboard: stats cards (deals, rating, earnings ₹), active listings table, AgriAdvisor entry, notifications
- Browse buyer requirements (list + filter + map-view toggle showing a static map image)
- Post a product listing form (3-tier pricing with Simple/Advanced toggle, photo upload UI, quality grade, AI price suggestion stub showing canned "₹40–₹70/kg")
- My listings (edit/pause/delete actions)
- AgriAdvisor chat (canned Q&A responses)

**Market Owner**
- Dashboard: stats, active requirements, AI demand-insights card with canned forecast
- Browse farmer listings (cards w/ photo, ₹/kg, freshness badge, grade, distance)
- Product detail page with "Start AI Bargaining" button → opens chat panel with scripted negotiation turns
- Post a requirement form (3-tier offer pricing)
- Deal detail page (status timeline, payment status, transport booking CTA)

**Delivery Partner**
- Registration form with document upload UI (4 file slots)
- Dashboard: Online/Offline toggle, incoming booking request modal (mocked), trips in progress, earnings card
- Trip detail page with status timeline (Booked → Assigned → Picked Up → In Transit → Delivered)

**Admin**
- Login (separate /admin route, mock password)
- Dashboard: platform stats, pending partner verifications, open disputes
- Verification detail (approve/reject)
- Dispute detail (resolution actions)

**Common flows**
- AI bargaining chat: scripted 4-turn negotiation that ends in deal confirmation modal
- Book transport flow: form → fare calculation preview → confirmation
- Payment escrow UI: mocked Razorpay-style modal → "paid into escrow" status
- Dispute raise form
- Rating modal (1–5 stars)

## Mock data layer

Single `src/lib/mock-data.ts` with typed seed data: users, product listings (tomatoes, onions, mangoes, rice with real produce photos), requirements, deals, transport bookings, ratings, notifications. All currency values stored as paise integers, displayed as `₹X.XX`. Hooks like `useMockListings()`, `useMockDeals()` to mimic data fetching.

## Routes (TanStack Start file-based)

```
src/routes/
  __root.tsx                 (shared shell + nav)
  index.tsx                  (landing)
  auth.login.tsx
  auth.signup.tsx
  auth.role.tsx
  _app/                      (logged-in shell with bottom tab bar)
  _app.home.tsx              (role-aware home)
  _app.browse.tsx
  _app.listings.$id.tsx
  _app.requirements.$id.tsx
  _app.post-listing.tsx
  _app.post-requirement.tsx
  _app.deals.tsx
  _app.deals.$id.tsx
  _app.advisor.tsx
  _app.profile.tsx
  _app.partner.dashboard.tsx
  _app.partner.register.tsx
  _app.partner.trips.$id.tsx
  admin.login.tsx
  admin.dashboard.tsx
  admin.verifications.$id.tsx
  admin.disputes.$id.tsx
```

(Per TanStack rules, each route file uses dot-separated naming and matches its `createFileRoute` path.)

## Image strategy

Use real produce photography via `imagegen` for 6–8 hero product photos (tomatoes, onions, mangoes, rice, chillies, dairy) stored in `src/assets/`. Stock-style profile avatars generated similarly. Static map screenshot used for map-view placeholder.

## Out of scope (deferred)

- Real auth (Lovable Cloud / OTP via Twilio)
- Real Claude API bargaining — scripted instead
- Razorpay payment processing
- Google Maps integration — static map images only
- WhatsApp/SendGrid notifications — in-app toasts only
- Delivery partner real-time matching
- Telugu/Hindi i18n — font support included, but copy stays English with a few Telugu/Hindi accents in headings (as shown in the design direction)

## Technical notes

- TanStack Start + Tailwind v4 + shadcn components already in template
- Tokens in `src/styles.css`: `--brand-green`, `--brand-clay`, `--brand-cream`, `--brand-moss` mapped via `@theme inline`
- Plus Jakarta Sans + Noto Sans Devanagari + Noto Sans Telugu via `<link>` in `__root.tsx` head
- Role state in a simple Zustand store (or React context) persisted to localStorage so the role switcher works across navigation
- All forms use react-hook-form + zod for realistic UX, but submit just toasts and navigates
- Framer-motion for the bargaining chat reveal and bottom-sheet transitions

Approve to start building, or tell me what to adjust (different design direction, smaller scope, different screens to prioritize).