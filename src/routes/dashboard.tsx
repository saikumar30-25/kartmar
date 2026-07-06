import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import {
  useMyListings, useMyDeals, useMyInterests, usePartnerTrips, useMyPartnerProfile,
  useRequireAuth,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, HandHeart, Handshake, Truck, Star, TrendingUp, MapPin,
  Sprout, ShoppingBasket, Shield,
} from "lucide-react";
import { rupees } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kartmar" }] }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function useRealtimeRefresh(uid: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`dashboard:${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        qc.invalidateQueries({ queryKey: ["my_listings"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => {
        qc.invalidateQueries({ queryKey: ["deals"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "interest_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["interests"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        qc.invalidateQueries({ queryKey: ["partner_trips"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);
}

function Dashboard() {
  const { user } = useRequireAuth();
  const { user: authUser } = useAuth();
  useRealtimeRefresh(user?.id);
  if (!authUser) return null;
  const role = authUser.role ?? "farmer";

  return (
    <div className="space-y-6">
      <header className="rounded-3xl gradient-hero text-brand-cream p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-40 bg-brand-clay/30 rounded-full blur-3xl" />
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Live dashboard</p>
        <h1 className="font-serif italic text-3xl mt-1">{authUser.name}'s {roleLabel(role)} dashboard</h1>
        <p className="text-sm opacity-90 mt-1 flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {authUser.district ?? "—"}, {authUser.state ?? "—"} · updates live
        </p>
      </header>

      {role === "farmer" && <FarmerBoard />}
      {role === "owner" && <BuyerBoard />}
      {role === "partner" && <PartnerBoard />}
      {role === "admin" && <AdminBoard />}
    </div>
  );
}

function roleLabel(r: string) {
  return r === "farmer" ? "Farmer" : r === "owner" ? "Buyer" : r === "partner" ? "Delivery Partner" : "Admin";
}

function FarmerBoard() {
  const { user } = useAuth();
  const { data: listings = [] } = useMyListings();
  const { data: deals = [] } = useMyDeals();
  const { data: interests = [] } = useMyInterests();
  const active = listings.filter((l: any) => l.status === "active").length;
  const pending = interests.filter((r: any) => r.status === "pending" && r.farmer_id === user?.id).length;
  const openDeals = deals.filter((d: any) => d.status !== "completed" && d.status !== "cancelled").length;
  const revenue = deals.filter((d: any) => d.status === "completed").reduce((s: number, d: any) => s + Number(d.total_paise ?? 0), 0);

  return (
    <>
      <StatGrid stats={[
        { icon: Package, label: "Active listings", value: String(active), to: "/my-listings" },
        { icon: HandHeart, label: "Pending bookings", value: String(pending), to: "/interests" },
        { icon: Handshake, label: "Open deals", value: String(openDeals), to: "/deals" },
        { icon: TrendingUp, label: "Total earnings", value: rupees(revenue), to: "/deals" },
      ]} />
      <RecentDeals deals={deals} />
    </>
  );
}

function BuyerBoard() {
  const { user } = useAuth();
  const { data: deals = [] } = useMyDeals();
  const { data: interests = [] } = useMyInterests();
  const sent = interests.filter((r: any) => r.buyer_id === user?.id);
  const pending = sent.filter((r: any) => r.status === "pending").length;
  const accepted = sent.filter((r: any) => r.status === "accepted").length;
  const openDeals = deals.filter((d: any) => d.status !== "completed" && d.status !== "cancelled").length;
  const spent = deals.filter((d: any) => d.status === "completed").reduce((s: number, d: any) => s + Number(d.total_paise ?? 0), 0);

  return (
    <>
      <StatGrid stats={[
        { icon: HandHeart, label: "Pending enquiries", value: String(pending), to: "/interests" },
        { icon: Star, label: "Accepted", value: String(accepted), to: "/interests" },
        { icon: Handshake, label: "Open deals", value: String(openDeals), to: "/deals" },
        { icon: TrendingUp, label: "Total spent", value: rupees(spent), to: "/deals" },
      ]} />
      <RecentDeals deals={deals} />
    </>
  );
}

function PartnerBoard() {
  const { data: trips = [] } = usePartnerTrips();
  const { data: profile } = useMyPartnerProfile();
  const offered = trips.filter((t: any) => t.status === "offered" && !t.partner_id).length;
  const mine = trips.filter((t: any) => t.partner_id).length;
  const active = trips.filter((t: any) => t.partner_id && ["accepted", "picked_up"].includes(t.status)).length;
  const done = trips.filter((t: any) => t.status === "delivered").length;

  return (
    <>
      <div className="rounded-2xl bg-card ring-1 ring-border p-4 flex items-center gap-3">
        <Shield className="size-5 text-brand-clay" />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification</p>
          <p className="font-semibold">
            {profile?.verification_status === "approved" ? "✅ Approved — you can accept trips" :
             profile?.verification_status === "rejected" ? "❌ Rejected — please re-submit documents" :
             "⏳ Under AI review"}
          </p>
        </div>
      </div>
      <StatGrid stats={[
        { icon: Truck, label: "Available trips", value: String(offered), to: "/partner" },
        { icon: Handshake, label: "My trips", value: String(mine), to: "/partner" },
        { icon: TrendingUp, label: "In progress", value: String(active), to: "/partner" },
        { icon: Star, label: "Delivered", value: String(done), to: "/partner" },
      ]} />
    </>
  );
}

function AdminBoard() {
  const { data: deals = [] } = useMyDeals();
  return (
    <>
      <StatGrid stats={[
        { icon: Sprout, label: "Farmers", value: "—", to: "/admin" },
        { icon: ShoppingBasket, label: "Buyers", value: "—", to: "/admin" },
        { icon: Truck, label: "Partners", value: "—", to: "/admin" },
        { icon: Handshake, label: "My deals", value: String(deals.length), to: "/deals" },
      ]} />
      <p className="text-xs text-muted-foreground text-center">Open the admin console for full oversight.</p>
    </>
  );
}

function StatGrid({ stats }: { stats: Array<{ icon: any; label: string; value: string; to: string }> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Link key={s.label} to={s.to} className="rounded-2xl bg-card ring-1 ring-border p-4 hover:ring-brand-clay/50 transition">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <s.icon className="size-3.5 text-brand-clay" /> {s.label}
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-green">{s.value}</p>
        </Link>
      ))}
    </div>
  );
}

function RecentDeals({ deals }: { deals: any[] }) {
  if (!deals.length) return null;
  return (
    <section>
      <h2 className="font-serif italic text-2xl text-brand-green mb-3">Recent deals</h2>
      <div className="space-y-2">
        {deals.slice(0, 5).map((d) => (
          <Link key={d.id} to="/deals/$id" params={{ id: d.id }} className="flex items-center gap-3 rounded-xl bg-card ring-1 ring-border p-3 hover:ring-brand-clay/40 transition">
            {d.photo_url && <img src={d.photo_url} alt="" className="size-12 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{d.product_name}</p>
              <p className="text-xs text-muted-foreground">{d.quantity} {d.unit} · {d.pickup_district ?? "—"} → {d.drop_district ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-brand-green text-rupee">{rupees(Number(d.total_paise ?? 0))}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
