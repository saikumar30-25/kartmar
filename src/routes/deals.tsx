import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMyDeals, useRequireAuth } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { DealStatus } from "./home";
import { Loader2, Inbox } from "lucide-react";

export const Route = createFileRoute("/deals")({
  head: () => ({ meta: [{ title: "My deals — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <DealsList />
    </AppShell>
  ),
});

function DealsList() {
  useRequireAuth();
  const { data: deals = [], isLoading } = useMyDeals();

  return (
    <div>
      <h1 className="font-serif italic text-4xl text-brand-green">My deals</h1>
      <p className="text-sm text-muted-foreground mt-1">{isLoading ? "Loading…" : `${deals.length} deals`}</p>

      {isLoading ? (
        <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>
      ) : deals.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <Inbox className="size-12 mx-auto opacity-40" />
          <p className="mt-3 font-semibold">No deals yet</p>
          <p className="text-sm">Browse listings and start a deal to see it here.</p>
          <Link to="/browse" className="mt-4 inline-block text-brand-clay font-semibold">Browse listings →</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {deals.map((d) => (
            <Link
              key={d.id}
              to="/deals/$id"
              params={{ id: d.id }}
              className="rounded-2xl bg-card ring-1 ring-border p-4 flex items-center gap-4 hover:ring-brand-clay/40 transition"
            >
              {d.photo_url ? (
                <img src={d.photo_url} alt="" className="size-20 rounded-xl object-cover" />
              ) : (
                <div className="size-20 rounded-xl bg-brand-moss/15" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{Number(d.quantity)}{d.unit} {d.product_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(d.created_at).toLocaleDateString()}</p>
                <div className="mt-2"><DealStatus status={d.status} /></div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-rupee">{rupees(Number(d.total_paise))}</p>
                <p className="text-xs text-muted-foreground">@ {rupees(Number(d.agreed_price_paise))}/{d.unit}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
