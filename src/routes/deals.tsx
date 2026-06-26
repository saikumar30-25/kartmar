import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { deals } from "@/lib/mock-data";
import { rupees } from "@/lib/format";
import { DealStatus } from "./home";

export const Route = createFileRoute("/deals")({
  head: () => ({ meta: [{ title: "My deals — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <DealsList />
    </AppShell>
  ),
});

function DealsList() {
  return (
    <div>
      <h1 className="font-serif italic text-4xl text-brand-green">My deals</h1>
      <p className="text-sm text-muted-foreground mt-1">{deals.length} confirmed deals</p>

      <div className="mt-6 grid gap-4">
        {deals.map((d) => (
          <Link
            key={d.id}
            to="/deals/$id"
            params={{ id: d.id }}
            className="rounded-2xl bg-card ring-1 ring-border p-4 flex items-center gap-4 hover:ring-brand-clay/40 transition"
          >
            <img src={d.photo} alt="" className="size-20 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{d.quantity}{d.unit} {d.productName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.farmerName} → {d.buyerName}</p>
              <div className="mt-2"><DealStatus status={d.status} /></div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-rupee">{rupees(d.totalPaise)}</p>
              <p className="text-xs text-muted-foreground">@ {rupees(d.agreedPrice)}/{d.unit}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
