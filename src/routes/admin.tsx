import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { deals } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Users, IndianRupee, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Admin />
    </AppShell>
  ),
});

function Admin() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-clay flex items-center gap-1.5">
          <Shield className="size-3" /> Admin console
        </p>
        <h1 className="font-serif italic text-4xl text-brand-green mt-1">Platform overview</h1>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        <Stat icon={Users} label="Total users" value="1,284" />
        <Stat icon={Check} label="Deals this week" value="142" />
        <Stat icon={IndianRupee} label="GMV (week)" value={rupees(8420000000)} />
        <Stat icon={AlertTriangle} label="Open disputes" value="3" />
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">Pending driver verifications</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
          {[
            { name: "Suresh K.", vehicle: "Small pickup · TS 12 CK 5511", district: "Warangal" },
            { name: "Ramesh N.", vehicle: "Two-wheeler · AP 07 BA 9923", district: "Vijayawada" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-4 p-4">
              <div className="size-10 rounded-full bg-brand-moss/15 text-brand-green font-bold grid place-items-center text-sm">
                {p.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.vehicle} · {p.district}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.error("Rejected.")}><X className="size-3.5 mr-1" /> Reject</Button>
              <Button size="sm" className="bg-brand-green text-brand-cream" onClick={() => toast.success("Approved. Partner notified.")}>
                <Check className="size-3.5 mr-1" /> Approve
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif italic text-2xl text-brand-green mb-4">Open disputes</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold">Deal D2 · Hotel Swagath ↔ Srinivas Rao</p>
              <p className="text-xs text-muted-foreground mt-1">Reason: Damaged goods — 50kg unusable</p>
              <p className="text-xs text-muted-foreground">Filed 6 hours ago · {rupees(deals[1].totalPaise)} in escrow</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.success("Full refund to buyer.")}>Refund buyer</Button>
              <Button size="sm" variant="outline" onClick={() => toast.success("50% split.")}>Split 50/50</Button>
              <Button size="sm" className="bg-brand-green text-brand-cream" onClick={() => toast.success("Released to farmer.")}>
                Release to farmer
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Link to="/home" className="text-xs font-bold text-brand-clay">← Back to app</Link>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-brand-clay" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-rupee">{value}</p>
    </div>
  );
}
