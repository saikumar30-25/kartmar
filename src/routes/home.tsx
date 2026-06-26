import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { listings, requirements, deals, demandForecast, partnerStats } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { Sparkles, TrendingUp, IndianRupee, Star, Package, Plus, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Home />
    </AppShell>
  ),
});

function Home() {
  const { user } = useAuth();
  if (!user) return null;

  const greeting = `${new Date().getHours() < 12 ? "Good morning" : "Good evening"}, ${user.name.split(" ")[0]}`;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">
          {user.role === "farmer" ? "Farmer dashboard" : user.role === "owner" ? "Buyer dashboard" : "Dashboard"}
        </p>
        <h1 className="font-serif italic text-4xl text-brand-green mt-1">{greeting}</h1>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Package} label="Active deals" value="08" tone="moss" />
        <Stat icon={IndianRupee} label="Earnings this month" value={rupees(partnerStats.earningsPaise)} tone="green" />
        <Stat icon={Star} label="Rating" value={`${user.rating} ★`} tone="clay" />
      </section>

      <section className="rounded-3xl bg-brand-green text-brand-cream p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-40 bg-brand-moss/40 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-brand-clay/90 text-white rounded-full px-2.5 py-1">
              <Sparkles className="size-3" /> AI insight
            </p>
            <h2 className="mt-3 font-serif italic text-2xl max-w-lg">
              {user.role === "owner"
                ? "Tomato prices may rise 15% next week — buy this week."
                : "Onion arrivals dropping in Nasik — hold stock 4 days for ~₹4/kg gain."}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {demandForecast.map((d) => (
                <span key={d.product} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 inline-flex items-center gap-1.5">
                  <TrendingUp className="size-3" /> {d.product}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/advisor"
            className="rounded-xl bg-brand-cream text-brand-green px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2"
          >
            <MessageSquare className="size-4" /> Ask AgriAdvisor
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-serif italic text-2xl text-brand-green">
              {user.role === "owner" ? "Fresh listings nearby" : "Buyer requirements near you"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Within 50km of {user.district}</p>
          </div>
          <Link to="/browse" className="text-xs font-bold text-brand-clay uppercase tracking-wider">View all →</Link>
        </div>

        {user.role === "owner" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.slice(0, 3).map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((r) => (
              <Link
                key={r.id}
                to="/requirements/$id"
                params={{ id: r.id }}
                className="rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-brand-clay/40 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-clay">Wanted</p>
                    <h3 className="mt-1 font-semibold text-lg">{r.quantity}{r.unit} {r.productName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{r.buyer.name} · {r.buyer.business}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-green text-rupee">{rupees(r.offerPrice)}</p>
                    <p className="text-[10px] text-muted-foreground">per {r.unit}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{r.distanceKm}km away · needed in 2 days</span>
                  <span className="font-bold text-brand-clay">Bargain →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {user.role === "farmer" && (
        <Link
          to="/post-listing"
          className="fixed bottom-24 right-6 lg:bottom-8 size-14 rounded-full bg-brand-clay text-white grid place-items-center shadow-xl shadow-brand-clay/30 hover:scale-105 transition z-30"
        >
          <Plus className="size-6" />
        </Link>
      )}
      {user.role === "owner" && (
        <Link
          to="/post-requirement"
          className="fixed bottom-24 right-6 lg:bottom-8 size-14 rounded-full bg-brand-clay text-white grid place-items-center shadow-xl shadow-brand-clay/30 hover:scale-105 transition z-30"
        >
          <Plus className="size-6" />
        </Link>
      )}

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">Recent deals</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
          {deals.map((d) => (
            <Link key={d.id} to="/deals/$id" params={{ id: d.id }} className="flex items-center gap-4 p-4 hover:bg-brand-cream/50">
              <img src={d.photo} alt="" className="size-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{d.quantity}{d.unit} {d.productName}</p>
                <p className="text-xs text-muted-foreground">{d.farmerName} → {d.buyerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rupee">{rupees(d.totalPaise)}</p>
                <DealStatus status={d.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: string; tone: "green" | "clay" | "moss" }) {
  const map = {
    green: "bg-brand-green/5 ring-brand-green/15 text-brand-green",
    clay: "bg-brand-clay/10 ring-brand-clay/20 text-brand-clay",
    moss: "bg-brand-moss/10 ring-brand-moss/20 text-brand-moss",
  } as const;
  return (
    <div className={`rounded-2xl p-5 ring-1 ${map[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground text-rupee">{value}</p>
    </div>
  );
}

export function DealStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmed", cls: "bg-stone-100 text-stone-700" },
    paid: { label: "Paid · escrow", cls: "bg-amber-100 text-amber-800" },
    in_transit: { label: "In transit", cls: "bg-blue-100 text-blue-800" },
    delivered: { label: "Delivered", cls: "bg-emerald-100 text-emerald-800" },
    completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800" },
    disputed: { label: "Disputed", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? map.confirmed;
  return <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>;
}
