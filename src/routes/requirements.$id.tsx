import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useRequirement, useRequireAuth } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { MapPin, Calendar, Loader2 } from "lucide-react";

export const Route = createFileRoute("/requirements/$id")({
  head: () => ({ meta: [{ title: "Requirement — AgriConnect" }] }),
  component: () => (
    <AppShell>
      <Detail />
    </AppShell>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  useRequireAuth();
  const { data: req, isLoading } = useRequirement(id);

  if (isLoading) return <div className="py-20 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  if (!req || !req.id) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Requirement not found</p>
        <Link to="/home" className="mt-4 inline-block text-brand-clay font-semibold">Back home</Link>
      </div>
    );
  }

  const offer = Number(req.target_price_paise ?? 0);
  const quantity = Number(req.quantity ?? 0);
  const unit = req.unit ?? "kg";

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-clay">Buyer requirement</p>
      <h1 className="mt-2 font-serif italic text-4xl text-brand-green">
        {quantity}{unit} {req.product_name}
      </h1>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-brand-green text-rupee">{offer ? rupees(offer) : "—"}</span>
        <span className="text-sm text-muted-foreground">per {unit} offered</span>
      </div>

      <div className="mt-6 rounded-2xl bg-card ring-1 ring-border p-5">
        <p className="font-semibold">Verified buyer</p>
        <p className="text-xs text-muted-foreground">Buyer identity is shared once you're matched on a deal.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Calendar className="size-3" /> Needed by
            </div>
            <p className="mt-1 font-semibold">{req.needed_by ?? "Flexible"}</p>
          </div>
          <div className="rounded-xl bg-brand-cream/60 ring-1 ring-border p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin className="size-3" /> Location
            </div>
            <p className="mt-1 font-semibold">{req.district}, {req.state}</p>
          </div>
        </div>
      </div>

      {req.notes && <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{req.notes}</p>}

      <p className="mt-8 text-xs text-muted-foreground">
        To connect with this buyer, post a matching listing — buyers will send you an interest request and share contact details on acceptance.
      </p>
    </div>
  );
}
