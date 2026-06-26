import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { partnerStats, trips, deals } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Truck, MapPin, Phone, Check, IndianRupee, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Partner dashboard — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Partner />
    </AppShell>
  ),
});

function Partner() {
  const [online, setOnline] = useState(partnerStats.online);
  const [request, setRequest] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Delivery partner</p>
          <h1 className="font-serif italic text-4xl text-brand-green mt-1">Driver dashboard</h1>
        </div>
        <label className="flex items-center gap-3 rounded-full bg-card ring-1 ring-border px-4 py-2">
          <span className={`size-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-stone-300"}`} />
          <span className="text-sm font-semibold">{online ? "Online" : "Offline"}</span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </label>
      </header>

      <section className="grid sm:grid-cols-3 gap-3">
        <Stat icon={Truck} label="Trips this month" value={`${partnerStats.tripsThisMonth}`} />
        <Stat icon={IndianRupee} label="Earnings" value={rupees(partnerStats.earningsPaise)} />
        <Stat icon={Star} label="Rating" value={`${partnerStats.rating} ★`} />
      </section>

      <section className="rounded-3xl bg-brand-clay/10 ring-1 ring-brand-clay/20 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-clay">Demo</p>
          <p className="font-semibold mt-1">Simulate an incoming booking request</p>
        </div>
        <Button onClick={() => setRequest(true)} className="bg-brand-clay text-white">
          Trigger request
        </Button>
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">Recent trips</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
          {trips.map((t) => {
            const deal = deals.find((d) => d.id === t.dealId);
            return (
              <div key={t.id} className="p-4 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-brand-moss/15 text-brand-moss grid place-items-center">
                  <Truck className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{deal?.productName} · {t.weightKg}kg</p>
                  <p className="text-xs text-muted-foreground">{t.pickup} → {t.delivery} · {t.distanceKm}km</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-rupee">{rupees(t.farePaise)}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{t.status.replaceAll("_", " ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-border p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-moss">Verification</p>
        <p className="mt-1 font-semibold">All documents verified</p>
        <p className="text-xs text-muted-foreground mt-1">Driving license, RC, vehicle photo, Aadhaar</p>
        <Link to="/partner/register" className="mt-3 inline-block text-xs font-bold text-brand-clay">Update documents →</Link>
      </section>

      <Dialog open={request} onOpenChange={setRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New booking request</DialogTitle>
            <DialogDescription>200kg tomatoes · 18km · 3 minutes to accept</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <Row icon={MapPin} label="Pickup" value="Guntur farm, AP" />
            <Row icon={MapPin} label="Delivery" value="FreshKart, Hyderabad" />
            <Row icon={Phone} label="Farmer" value="Venkata Reddy · +91 98765…" />
            <div className="rounded-xl bg-brand-cream p-3 flex justify-between">
              <span className="text-xs text-muted-foreground">Estimated fare</span>
              <span className="font-bold text-rupee">{rupees(480000)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequest(false)} className="flex-1">Reject</Button>
            <Button
              onClick={() => {
                setRequest(false);
                toast.success("Trip accepted. Customer notified.");
              }}
              className="flex-1 bg-brand-green text-brand-cream"
            >
              <Check className="size-4 mr-1.5" /> Accept trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-brand-clay" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-rupee">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-brand-moss mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
