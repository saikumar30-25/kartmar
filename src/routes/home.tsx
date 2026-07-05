import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useListings, useMyDeals, useRequireAuth, useForbidPartner } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Sparkles, TrendingUp, Star, Package,
  Plus, Leaf, Wheat, Apple, Carrot, Flame, Milk, Nut, Filter,
} from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Kartmar — Fresh from farms near you" }] }),
  component: () => (
    <AppShell>
      <Home />
    </AppShell>
  ),
});

const CATEGORIES = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "vegetables", label: "Vegetables", icon: Carrot },
  { key: "fruits", label: "Fruits", icon: Apple },
  { key: "grains", label: "Grains", icon: Wheat },
  { key: "spices", label: "Spices", icon: Flame },
  { key: "dairy", label: "Dairy", icon: Milk },
  { key: "pulses", label: "Pulses", icon: Nut },
  { key: "leafy", label: "Leafy", icon: Leaf },
] as const;

function Home() {
  useRequireAuth(); useForbidPartner();
  const { user } = useAuth();
  const { data: listings = [] } = useListings();
  const { data: deals = [] } = useMyDeals();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc">("new");
  const [near, setNear] = useState(true);

  if (!user) return null;

  const greeting = `${new Date().getHours() < 12 ? "Good morning" : "Good evening"}, ${user.name.split(" ")[0]}`;

  // Top markets = districts with most active listings
  const markets = useMemo(() => {
    const m = new Map<string, { district: string; state: string | null; count: number; sample?: any }>();
    for (const l of listings) {
      const key = `${l.district}`;
      const cur = m.get(key) ?? { district: l.district!, state: l.state, count: 0, sample: l };
      cur.count += 1;
      if (!cur.sample?.photo_url && l.photo_url) cur.sample = l;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [listings]);

  // Top farmers = farmer_ids with most listings
  const topFarmers = useMemo(() => {
    const m = new Map<string, { id: string; count: number; district: string | null; sample?: any }>();
    for (const l of listings) {
      const cur = m.get(l.farmer_id) ?? { id: l.farmer_id, count: 0, district: l.district, sample: l };
      cur.count += 1;
      if (!cur.sample?.photo_url && l.photo_url) cur.sample = l;
      m.set(l.farmer_id, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [listings]);

  const filtered = useMemo(() => {
    let out = listings.slice();
    if (near && user.district) out = out.filter((l) => l.district === user.district).concat(out.filter((l) => l.district !== user.district));
    if (cat !== "all") out = out.filter((l) => (l.category ?? "").toLowerCase() === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((l) =>
        l.product_name.toLowerCase().includes(q) ||
        (l.district ?? "").toLowerCase().includes(q) ||
        (l.category ?? "").toLowerCase().includes(q),
      );
    }
    if (sort === "price_asc") out.sort((a, b) => Number(a.price_paise) - Number(b.price_paise));
    if (sort === "price_desc") out.sort((a, b) => Number(b.price_paise) - Number(a.price_paise));
    if (sort === "new") out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return out;
  }, [listings, cat, query, sort, near, user.district]);

  const activeDeals = deals.filter((d) => d.status !== "completed" && d.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Hero + search */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green via-brand-green to-brand-moss text-brand-cream p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 size-56 bg-brand-clay/30 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{greeting}</p>
          <h1 className="mt-1 font-serif italic text-3xl sm:text-4xl max-w-xl">
            Fresh from farms near {user.district ?? "you"} — delivered fast.
          </h1>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white text-foreground px-4 py-2.5 shadow-lg max-w-2xl">
            <Search className="size-4 text-brand-moss shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tomatoes, onions, mangoes, districts…"
              className="border-0 shadow-none focus-visible:ring-0 h-9 px-0"
            />
            <button
              onClick={() => setNear((v) => !v)}
              className={`shrink-0 hidden sm:flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 ${near ? "bg-brand-green text-brand-cream" : "bg-stone-100 text-stone-600"}`}
            >
              <MapPin className="size-3" /> Near me
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Chip>Free pickup {'>'}5kg</Chip>
            <Chip>Escrow-protected pay</Chip>
            <Chip>AI-verified sellers</Chip>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-3">
        <MiniStat icon={Package} label="Active deals" value={String(activeDeals)} />
        <MiniStat icon={TrendingUp} label="Fresh listings" value={String(listings.length)} />
        <MiniStat icon={Star} label="Your rating" value={`${user.rating} ★`} />
      </section>

      {/* Category rail */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-serif italic text-2xl text-brand-green">Shop by category</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
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

      {/* Top markets rail */}
      {markets.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-serif italic text-2xl text-brand-green">Top markets near you</h2>
              <p className="text-xs text-muted-foreground">Districts with most fresh stock</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {markets.map((m) => (
              <button
                key={m.district}
                onClick={() => { setQuery(m.district); setNear(false); }}
                className="shrink-0 w-52 rounded-2xl overflow-hidden ring-1 ring-border bg-card text-left hover:ring-brand-clay/40 transition"
              >
                <div className="h-24 bg-brand-moss/20 relative">
                  {m.sample?.photo_url && <img src={m.sample.photo_url} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{m.state}</p>
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

      {/* Top farmers rail */}
      {topFarmers.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-serif italic text-2xl text-brand-green">Top farmers</h2>
              <p className="text-xs text-muted-foreground">Most active sellers this week</p>
            </div>
            <Link to="/browse" className="text-xs font-bold text-brand-clay uppercase tracking-wider">View all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {topFarmers.map((f, i) => (
              <div
                key={f.id}
                className="shrink-0 w-44 rounded-2xl bg-card ring-1 ring-border p-4 text-center hover:ring-brand-clay/40 transition"
              >
                <div className="size-14 mx-auto rounded-full bg-brand-green/10 text-brand-green grid place-items-center font-bold ring-2 ring-brand-clay/30">
                  #{i + 1}
                </div>
                <p className="mt-2 font-semibold text-sm truncate">Farmer {f.id.slice(0, 6)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{f.district ?? "—"}</p>
                <p className="mt-2 text-xs font-bold text-brand-clay">{f.count} products</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fresh listings grid with filter bar */}
      <section>
        <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="font-serif italic text-2xl text-brand-green">
              {cat === "all" ? "Fresh listings" : `Fresh ${CATEGORIES.find((c) => c.key === cat)?.label ?? ""}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {near && user.district ? `Prioritised from ${user.district}` : "From across India"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-9 rounded-full bg-card ring-1 ring-border text-xs font-semibold px-3"
            >
              <option value="new">Newest</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No listings match. Try a different filter.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.slice(0, 24).map((l) => (
              <Link
                key={l.id}
                to="/listings/$id"
                params={{ id: l.id }}
                className="rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:ring-brand-clay/50 transition group"
              >
                <div className="aspect-square bg-brand-moss/15 relative overflow-hidden">
                  {l.photo_url ? (
                    <img src={l.photo_url} alt={l.product_name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-brand-moss"><Leaf className="size-8" /></div>
                  )}
                  {l.district === user.district && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest bg-white/95 text-brand-green rounded-full px-2 py-0.5">
                      Near you
                    </span>
                  )}
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
              </Link>
            ))}
          </div>
        )}
      </section>

      {(user.role === "farmer" || user.role === "owner") && (
        <Link
          to={user.role === "farmer" ? "/post-listing" : "/post-requirement"}
          className="fixed bottom-24 right-6 lg:bottom-8 size-14 rounded-full bg-brand-clay text-white grid place-items-center shadow-xl shadow-brand-clay/30 hover:scale-105 transition z-30"
          aria-label="Post new"
        >
          <Plus className="size-6" />
        </Link>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 font-medium">
      {children}
    </span>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3 text-brand-clay" /> {label}
      </div>
      <p className="mt-1 text-xl sm:text-2xl font-bold text-rupee">{value}</p>
    </div>
  );
}
