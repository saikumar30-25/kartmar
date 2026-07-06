import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePublicListings, distanceRank } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { rupees } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Sparkles, TrendingUp, Star, Leaf, Wheat, Apple, Carrot,
  Flame, Milk, Nut, Sprout, ShoppingBasket, Truck, Shield, LogIn,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kartmar — Fresh from Indian farms, direct to you" },
      { name: "description", content: "Browse fresh farm produce near you. AI-powered fair pricing, verified farmers, integrated delivery." },
      { property: "og:title", content: "Kartmar — Fresh from farms" },
      { property: "og:description", content: "Top markets, top farmers, and today's freshest produce across India." },
    ],
  }),
  component: Landing,
});

const CATEGORIES = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "Vegetables", label: "Vegetables", icon: Carrot },
  { key: "Fruits", label: "Fruits", icon: Apple },
  { key: "Grains", label: "Grains", icon: Wheat },
  { key: "Spices", label: "Spices", icon: Flame },
  { key: "Dairy", label: "Dairy", icon: Milk },
  { key: "Pulses", label: "Pulses", icon: Nut },
  { key: "Leafy", label: "Leafy", icon: Leaf },
];

const ROLES = [
  { icon: Sprout, label: "Farmer", desc: "List your harvest, set a floor price, let AI bargain." },
  { icon: ShoppingBasket, label: "Buyer", desc: "Shop, mandi, restaurant — buy directly from farmers." },
  { icon: Truck, label: "Delivery Partner", desc: "Pick up trips near you and earn per delivery." },
  { icon: Shield, label: "Admin", desc: "Oversee marketplace health and disputes." },
];

function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listings = [], isLoading } = usePublicListings();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const target = user ? { district: user.district, state: user.state } : null;

  const markets = useMemo(() => {
    const m = new Map<string, { district: string; state: string | null; count: number; sample?: any }>();
    for (const l of listings) {
      if (!l.district) continue;
      const cur = m.get(l.district) ?? { district: l.district, state: l.state, count: 0, sample: l };
      cur.count += 1;
      if (!cur.sample?.photo_url && l.photo_url) cur.sample = l;
      m.set(l.district, cur);
    }
    return Array.from(m.values())
      .sort((a, b) => {
        const ra = distanceRank(target, a);
        const rb = distanceRank(target, b);
        if (ra !== rb) return ra - rb;
        return b.count - a.count;
      })
      .slice(0, 8);
  }, [listings, target]);

  const topFarmers = useMemo(() => {
    const m = new Map<string, { id: string; district: string | null; state: string | null; count: number; sample?: any }>();
    for (const l of listings) {
      const cur = m.get(l.farmer_id) ?? { id: l.farmer_id, district: l.district, state: l.state, count: 0, sample: l };
      cur.count += 1;
      if (!cur.sample?.photo_url && l.photo_url) cur.sample = l;
      m.set(l.farmer_id, cur);
    }
    return Array.from(m.values())
      .sort((a, b) => {
        const ra = distanceRank(target, a);
        const rb = distanceRank(target, b);
        if (ra !== rb) return ra - rb;
        return b.count - a.count;
      })
      .slice(0, 6);
  }, [listings, target]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = listings.filter((l) => {
      if (cat !== "all" && (l.category ?? "") !== cat) return false;
      if (q && !l.product_name.toLowerCase().includes(q) && !(l.district ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
    out.sort((a, b) => {
      const ra = distanceRank(target, a);
      const rb = distanceRank(target, b);
      if (ra !== rb) return ra - rb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return out;
  }, [listings, cat, query, target]);

  // Any tap on a product / booking action requires login.
  const gate = (path?: string) => {
    if (user) {
      navigate({ to: path ?? "/home" });
    } else {
      navigate({ to: "/auth" });
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-foreground">
      <header className="sticky top-0 z-40 bg-brand-cream/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="size-9 rounded-xl bg-brand-green text-brand-cream grid place-items-center font-serif text-xl italic">K</div>
            <span className="font-serif italic text-xl text-brand-green">Kartmar</span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-lg items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-border">
            <Search className="size-4 text-brand-moss" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tomatoes, onions, mangoes, districts…"
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link to="/home" className="rounded-lg bg-brand-green text-brand-cream px-4 py-2 text-sm font-semibold hover:bg-brand-green/90">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-brand-green hover:text-brand-clay">Sign in</Link>
                <Link to="/auth" className="rounded-lg bg-brand-green text-brand-cream px-4 py-2 text-sm font-semibold hover:bg-brand-green/90">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-8">
        {/* Hero */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-green via-brand-green to-brand-moss text-brand-cream p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-56 bg-brand-clay/30 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Built for India · भारत · ఇండియా</p>
            <h1 className="mt-1 font-serif italic text-3xl sm:text-5xl max-w-2xl leading-tight">
              Fresh from farms — direct to your kitchen, shop or mandi.
            </h1>
            <p className="mt-3 text-sm sm:text-base opacity-90 max-w-xl">
              AI-powered fair pricing. Verified farmers. Same-day pickup by our delivery partners.
            </p>
            <div className="mt-5 flex md:hidden items-center gap-2 rounded-full bg-white text-foreground px-4 py-2">
              <Search className="size-4 text-brand-moss" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search produce or district" className="border-0 shadow-none focus-visible:ring-0 h-8 px-0" />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const active = cat === key;
              return (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl ring-1 transition px-4 py-3 min-w-[92px] ${
                    active ? "bg-brand-green text-brand-cream ring-brand-green" : "bg-card text-foreground ring-border hover:ring-brand-clay/40"
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Top markets */}
        {markets.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="font-serif italic text-2xl text-brand-green">
                  {target?.district ? `Top markets near ${target.district}` : "Top markets across India"}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3" /> Districts with the most fresh stock today
                </p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {markets.map((m) => (
                <button
                  key={m.district}
                  onClick={() => gate()}
                  className="shrink-0 w-52 rounded-2xl overflow-hidden ring-1 ring-border bg-card text-left hover:ring-brand-clay/40 transition"
                >
                  <div className="h-24 bg-brand-moss/20 relative">
                    {m.sample?.photo_url && <img src={m.sample.photo_url} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{m.state ?? "India"}</p>
                      <p className="font-bold text-sm">{m.district}</p>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.count} listings</span>
                    <span className="text-xs font-bold text-brand-clay">Explore →</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Top farmers */}
        {topFarmers.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="font-serif italic text-2xl text-brand-green">Top farmers</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="size-3" /> Most active sellers this week</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {topFarmers.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => gate()}
                  className="shrink-0 w-44 rounded-2xl bg-card ring-1 ring-border p-4 text-center hover:ring-brand-clay/40 transition"
                >
                  <div className="size-14 mx-auto rounded-full bg-brand-green/10 text-brand-green grid place-items-center font-bold ring-2 ring-brand-clay/30">
                    #{i + 1}
                  </div>
                  <p className="mt-2 font-semibold text-sm truncate">Farmer {f.id.slice(0, 6)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{f.district ?? "—"}{f.state ? `, ${f.state}` : ""}</p>
                  <p className="mt-2 text-xs font-bold text-brand-clay">{f.count} products</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Listings grid */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-serif italic text-2xl text-brand-green">
                {cat === "all" ? "Fresh today" : `Fresh ${cat}`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {target?.district ? `Prioritised from ${target.district}` : "From across India — sign in to see near you"}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground text-sm">Loading fresh produce…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground text-sm">No listings match. Try a different category.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.slice(0, 24).map((l) => (
                <button
                  key={l.id}
                  onClick={() => gate(`/listings/${l.id}`)}
                  className="text-left rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:ring-brand-clay/50 transition group"
                >
                  <div className="aspect-square bg-brand-moss/15 relative overflow-hidden">
                    {l.photo_url ? (
                      <img src={l.photo_url} alt={l.product_name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-brand-moss"><Leaf className="size-8" /></div>
                    )}
                    {distanceRank(target, l) === 0 && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest bg-white/95 text-brand-green rounded-full px-2 py-0.5">
                        Near you
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest bg-black/70 text-white rounded-full px-2 py-0.5 flex items-center gap-1">
                      <LogIn className="size-2.5" /> Login to buy
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-moss truncate">{l.category}</p>
                    <p className="mt-0.5 font-semibold text-sm truncate">{l.product_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate"><MapPin className="size-2.5 inline" /> {l.district}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-bold text-brand-green text-rupee">{rupees(Number(l.price_paise))}</span>
                      <span className="text-[10px] text-muted-foreground">/{l.unit}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Roles */}
        <section className="rounded-3xl bg-card ring-1 ring-border p-6">
          <h2 className="font-serif italic text-2xl text-brand-green text-center">Kartmar is for everyone in the chain</h2>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map((r) => (
              <div key={r.label} className="rounded-2xl bg-brand-cream/60 p-4 ring-1 ring-border">
                <div className="size-10 rounded-xl bg-brand-green/10 text-brand-green grid place-items-center">
                  <r.icon className="size-5" />
                </div>
                <h3 className="mt-3 font-semibold text-sm">{r.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/auth" className="inline-flex items-center justify-center rounded-xl bg-brand-clay text-white px-6 py-3 text-sm font-bold hover:bg-brand-clay/90">
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-brand-green/5">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <p>© Kartmar · Built for Indian agriculture</p>
          <p>Demo prototype — payments are simulated</p>
        </div>
      </footer>
    </div>
  );
}
